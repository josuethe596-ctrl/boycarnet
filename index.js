const { 
  Client, 
  GatewayIntentBits, 
  REST, 
  Routes, 
  SlashCommandBuilder,
  MessageFlags
} = require('discord.js');
const fs = require('fs');

// ===== CLIENT =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// ===== CONFIG =====
const TOKEN = process.env.TOKEN;
const CLIENT_ID = '1503744068134637750';
const CANAL_CARNETS = '1444812609441501275';
const GUILD_IDS = ['1123790874741047356', '1464318287683780836'];

// ===== ROLES / SECCIONES (orden de prioridad) =====
const ROLES_CARNETS = {
  '1249081905631203419': 'Commissioned Officers',
  '1465107741550051369': 'Warrant Officers',
  '1249072506850246819': 'Staff Non-Commissioned Officers',
  '1249076967156875265': 'Non-Commissioned Officers',
  '1249080467198836787': 'Junior Enlisted'
};

// Orden de categorías para agrupar (primero = arriba)
const CATEGORIA_ORDEN = [
  '1249081905631203419',
  '1465107741550051369',
  '1249072506850246819',
  '1249076967156875265',
  '1249080467198836787'
];

// ===== ADMIN ROLES =====
const ROLES_ADMIN = ['1249089576270698452','1249089640632422470'];

// ===== DATA =====
const DATA_FILE = './data.json';
function loadData() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE)); } 
  catch { fs.writeFileSync(DATA_FILE, '{}'); return {}; }
}
function saveData(data) { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2)); }

// ===== SAFE REPLY =====
async function safeReply(interaction, options) {
  try {
    if (interaction.deferred) return await interaction.editReply(options);
    if (interaction.replied) return await interaction.followUp(options);
    else return await interaction.reply(options);
  } catch (err) { console.error(err); }
}

// ===== OBTENER TODOS LOS CARNETS DEL CANAL =====
async function obtenerCarnetsDelCanal(canal) {
  try {
    const mensajes = await canal.messages.fetch({ limit: 100 });
    const data = loadData();
    const carnets = [];
    
    for (const [msgId, msg] of mensajes) {
      if (msg.attachments.size === 0) continue;
      
      // Buscar a qué usuario pertenece este mensaje
      const entry = Object.entries(data).find(([userId, info]) => info.mensajeId === msgId);
      if (entry) {
        carnets.push({
          userId: entry[0],
          ...entry[1],
          msg: msg
        });
      }
    }
    
    return carnets;
  } catch (err) {
    console.error('Error obteniendo carnets:', err);
    return [];
  }
}

// ===== REORGANIZAR TODO EL CANAL =====
async function reorganizarCanal(canal) {
  const data = loadData();
  const carnets = await obtenerCarnetsDelCanal(canal);
  
  // Agrupar por categoría
  const porCategoria = {};
  CATEGORIA_ORDEN.forEach(cat => porCategoria[cat] = []);
  
  for (const carnet of carnets) {
    if (porCategoria[carnet.categoria]) {
      porCategoria[carnet.categoria].push(carnet);
    }
  }
  
  // Borrar todos los mensajes actuales
  for (const carnet of carnets) {
    await carnet.msg.delete().catch(() => {});
  }
  
  // Reenviar en orden
  const nuevoData = {};
  
  for (const catId of CATEGORIA_ORDEN) {
    const lista = porCategoria[catId];
    if (lista.length === 0) continue;
    
    const nombreRol = ROLES_CARNETS[catId];
    let primera = true;
    
    for (const carnet of lista) {
      let content;
      if (primera) {
        content = `# ${nombreRol}\n<<@${carnet.userId}>`;
        primera = false;
      } else {
        content = `<<@${carnet.userId}>`;
      }
      
      const nuevoMsg = await canal.send({
        content: content,
        files: [carnet.imagen]
      });
      
      nuevoData[carnet.userId] = {
        categoria: carnet.categoria,
        categoriaNombre: carnet.categoriaNombre,
        imagen: carnet.imagen,
        mensajeId: nuevoMsg.id,
        fecha: carnet.fecha
      };
    }
  }
  
  // Guardar nuevos IDs
  for (const [userId, info] of Object.entries(nuevoData)) {
    data[userId] = info;
  }
  
  // Limpiar usuarios que ya no están
  for (const userId of Object.keys(data)) {
    if (!nuevoData[userId]) delete data[userId];
  }
  
  saveData(data);
  return nuevoData;
}

// ===== COMANDOS =====
const commands = [
  new SlashCommandBuilder()
    .setName('carnet')
    .setDescription('Subir carnet militar de un usuario')
    .addAttachmentOption(option =>
      option.setName('imagen')
        .setDescription('Imagen del carnet')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('categoria')
        .setDescription('Selecciona la categoria del carnet')
        .setRequired(true)
        .addChoices(
          { name: 'Commissioned Officers', value: '1249081905631203419' },
          { name: 'Warrant Officers', value: '1465107741550051369' },
          { name: 'Staff Non-Commissioned Officers', value: '1249072506850246819' },
          { name: 'Non-Commissioned Officers', value: '1249076967156875265' },
          { name: 'Junior Enlisted', value: '1249080467198836787' }
        )
    )
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario al que pertenece el carnet')
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('ingreso')
    .setDescription('Agregar carnet de un usuario (admin)')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario al que asignar el carnet')
        .setRequired(true)
    )
    .addAttachmentOption(option =>
      option.setName('imagen')
        .setDescription('Imagen del carnet')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('categoria')
        .setDescription('Selecciona la categoria del carnet')
        .setRequired(true)
        .addChoices(
          { name: 'Commissioned Officers', value: '1249081905631203419' },
          { name: 'Warrant Officers', value: '1465107741550051369' },
          { name: 'Staff Non-Commissioned Officers', value: '1249072506850246819' },
          { name: 'Non-Commissioned Officers', value: '1249076967156875265' },
          { name: 'Junior Enlisted', value: '1249080467198836787' }
        )
    ),
  new SlashCommandBuilder()
    .setName('baja')
    .setDescription('Eliminar el carnet de un usuario (admin)')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario al que quitar el carnet')
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('mycarnet')
    .setDescription('Ver tu carnet registrado'),
  new SlashCommandBuilder()
    .setName('reorganizarcarnets')
    .setDescription('Reorganizar todo el canal de carnets (admin)')
].map(cmd => cmd.toJSON());

// ===== REGISTRAR COMANDOS =====
const rest = new REST({ version: '10' }).setToken(TOKEN);
client.once('clientReady', async () => {
  console.log(`Bot iniciado: ${client.user.tag}`);
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });
    console.log('Comandos globales borrados');
    
    for (const guildId of GUILD_IDS) {
      try {
        await rest.put(
          Routes.applicationGuildCommands(CLIENT_ID, guildId), 
          { body: commands }
        );
        console.log(`Comandos registrados en guild ${guildId}`);
      } catch (guildErr) {
        console.error(`Error en guild ${guildId}:`, guildErr.message);
      }
    }
    
    console.log('Registro de comandos completado');
  } catch (err) { 
    console.error('ERROR REGISTRANDO COMANDOS:', err); 
  }
});

// ===== INTERACCIONES =====
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  try {
    const data = loadData();
    const userId = interaction.user.id;

    // ===== /CARNET =====
    if (interaction.commandName === 'carnet') {
      const imagen = interaction.options.getAttachment('imagen');
      const categoria = interaction.options.getString('categoria');
      const usuario = interaction.options.getUser('usuario');

      if (!usuario) {
        return safeReply(interaction, { 
          content: '❌ Error: No se pudo obtener el usuario.', 
          flags: MessageFlags.Ephemeral 
        });
      }

      if (!imagen || !imagen.contentType || !imagen.contentType.startsWith('image')) {
        return safeReply(interaction, { content: '❌ Debes subir una imagen válida.', flags: MessageFlags.Ephemeral });
      }

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const canal = await client.channels.fetch(CANAL_CARNETS);
      if (!canal) return interaction.editReply({ content: '❌ No se encontró el canal.' });

      // Si ya tiene carnet, eliminarlo primero
      if (data[usuario.id]) {
        const msgOld = await canal.messages.fetch(data[usuario.id].mensajeId).catch(() => null);
        if (msgOld) await msgOld.delete().catch(() => {});
        delete data[usuario.id];
        saveData(data);
      }

      // Agregar el nuevo carnet a data temporalmente
      data[usuario.id] = {
        categoria,
        categoriaNombre: ROLES_CARNETS[categoria],
        imagen: imagen.url,
        mensajeId: 'temp',
        fecha: new Date().toISOString()
      };
      saveData(data);

      // Reorganizar TODO el canal para mantener orden por categoría
      await reorganizarCanal(canal);

      return interaction.editReply({ 
        content: `✅ Carnet de **${ROLES_CARNETS[categoria]}** subido para <@${usuario.id}>.\n📋 Canal reorganizado por categorías.`, 
        flags: MessageFlags.Ephemeral 
      });
    }

    // ===== /INGRESO =====
    if (interaction.commandName === 'ingreso') {
      if (!interaction.member.roles.cache.some(r => ROLES_ADMIN.includes(r.id))) {
        return safeReply(interaction, { content: '❌ Acceso denegado.', flags: MessageFlags.Ephemeral });
      }

      const usuario = interaction.options.getUser('usuario');
      const imagen = interaction.options.getAttachment('imagen');
      const categoria = interaction.options.getString('categoria');

      if (!usuario) {
        return safeReply(interaction, { content: '❌ Debes especificar un usuario.', flags: MessageFlags.Ephemeral });
      }

      if (!imagen || !imagen.contentType || !imagen.contentType.startsWith('image')) {
        return safeReply(interaction, { content: '❌ Debes subir una imagen válida.', flags: MessageFlags.Ephemeral });
      }

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const canal = await client.channels.fetch(CANAL_CARNETS);
      if (!canal) return interaction.editReply({ content: '❌ No se encontró el canal.' });

      // Si ya tiene carnet, eliminarlo
      if (data[usuario.id]) {
        const msgOld = await canal.messages.fetch(data[usuario.id].mensajeId).catch(() => null);
        if (msgOld) await msgOld.delete().catch(() => {});
        delete data[usuario.id];
        saveData(data);
      }

      // Agregar temporalmente
      data[usuario.id] = {
        categoria,
        categoriaNombre: ROLES_CARNETS[categoria],
        imagen: imagen.url,
        mensajeId: 'temp',
        fecha: new Date().toISOString()
      };
      saveData(data);

      // Reorganizar todo
      await reorganizarCanal(canal);

      return interaction.editReply({ 
        content: `✅ Carnet agregado para <@${usuario.id}>.\n📋 Canal reorganizado por categorías.`, 
        flags: MessageFlags.Ephemeral 
      });
    }

    // ===== /BAJA =====
    if (interaction.commandName === 'baja') {
      if (!interaction.member.roles.cache.some(r => ROLES_ADMIN.includes(r.id))) {
        return safeReply(interaction, { content: '❌ Acceso denegado.', flags: MessageFlags.Ephemeral });
      }

      const usuario = interaction.options.getUser('usuario');

      if (!usuario) {
        return safeReply(interaction, { content: '❌ Debes especificar un usuario.', flags: MessageFlags.Ephemeral });
      }

      if (!data[usuario.id]) {
        return safeReply(interaction, { content: '❌ Este usuario no tiene carnet registrado.', flags: MessageFlags.Ephemeral });
      }

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const canal = await client.channels.fetch(CANAL_CARNETS);

      // Borrar el mensaje del carnet
      const msgOld = await canal.messages.fetch(data[usuario.id].mensajeId).catch(() => null);
      if (msgOld) await msgOld.delete().catch(() => {});

      // Eliminar de data
      delete data[usuario.id];
      saveData(data);

      // Reorganizar todo el canal
      await reorganizarCanal(canal);

      return interaction.editReply({ 
        content: `✅ Carnet de <@${usuario.id}> eliminado.\n📋 Canal reorganizado por categorías.`, 
        flags: MessageFlags.Ephemeral 
      });
    }

    // ===== /REORGANIZARCARNETS =====
    if (interaction.commandName === 'reorganizarcarnets') {
      if (!interaction.member.roles.cache.some(r => ROLES_ADMIN.includes(r.id))) {
        return safeReply(interaction, { content: '❌ Acceso denegado.', flags: MessageFlags.Ephemeral });
      }

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const canal = await client.channels.fetch(CANAL_CARNETS);
      
      await reorganizarCanal(canal);

      return interaction.editReply({ 
        content: '✅ Canal de carnets reorganizado completamente.', 
        flags: MessageFlags.Ephemeral 
      });
    }

    // ===== /MYCARNET =====
    if (interaction.commandName === 'mycarnet') {
      if (!data[userId]) {
        return safeReply(interaction, { content: '❌ No tienes carnet registrado.', flags: MessageFlags.Ephemeral });
      }
      const carnet = data[userId];
      return safeReply(interaction, { 
        content: `**Categoría:** ${carnet.categoriaNombre}\n**Fecha:** ${new Date(carnet.fecha).toLocaleDateString()}\n${carnet.imagen}`, 
        flags: MessageFlags.Ephemeral 
      });
    }

  } catch (err) {
    console.error('Error en interacción:', err);
    try {
      if (interaction.deferred) await interaction.editReply({ content: '❌ Ocurrió un error.', flags: MessageFlags.Ephemeral });
      else if (interaction.replied) await interaction.followUp({ content: '❌ Ocurrió un error.', flags: MessageFlags.Ephemeral });
      else await interaction.reply({ content: '❌ Ocurrió un error.', flags: MessageFlags.Ephemeral });
    } catch {}
  }
});

// ===== LOGIN =====
client.login(TOKEN);
