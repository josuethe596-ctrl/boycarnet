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

// ===== ROLES / SECCIONES =====
const ROLES_CARNETS = {
  '1249081905631203419': 'Commissioned Officers',
  '1465107741550051369': 'Warrant Officers',
  '1249072506850246819': 'Staff Non-Commissioned Officers',
  '1249076967156875265': 'Non-Commissioned Officers',
  '1249080467198836787': 'Junior Enlisted'
};

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
  } catch (err) { console.error('safeReply error:', err); }
}

// ===== ENCONTRAR ÚLTIMO MENSAJE DE UNA CATEGORÍA =====
async function encontrarUltimoDeCategoria(canal, categoriaId, data) {
  try {
    const mensajes = await canal.messages.fetch({ limit: 100 });
    const msgsArray = Array.from(mensajes.values()).reverse(); // De más antiguo a más nuevo
    
    let ultimoMsg = null;
    let esPrimera = true;
    
    for (const msg of msgsArray) {
      if (msg.attachments.size === 0) continue;
      
      // Buscar a qué usuario pertenece
      const entry = Object.entries(data).find(([userId, info]) => info.mensajeId === msg.id);
      if (!entry) continue;
      
      const info = entry[1];
      if (info.categoria === categoriaId) {
        ultimoMsg = msg;
        esPrimera = false;
      }
    }
    
    return { ultimoMsg, esPrimera };
  } catch (err) {
    console.error('Error buscando categoría:', err);
    return { ultimoMsg: null, esPrimera: true };
  }
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
    .setName('organizar')
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
    let data = loadData();
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

      // Si ya tiene carnet, eliminarlo
      if (data[usuario.id]) {
        try {
          const msgOld = await canal.messages.fetch(data[usuario.id].mensajeId);
          await msgOld.delete();
        } catch (e) {
          console.log('No se pudo borrar carnet anterior:', e.message);
        }
        delete data[usuario.id];
        saveData(data);
      }

      // Buscar dónde poner el nuevo carnet
      const { ultimoMsg, esPrimera } = await encontrarUltimoDeCategoria(canal, categoria, data);

      // Preparar contenido
      let content;
      if (esPrimera) {
        content = `# ${ROLES_CARNETS[categoria]}\n<<@${usuario.id}>`;
      } else {
        content = `<<@${usuario.id}>`;
      }

      // Enviar mensaje
      let msg;
      if (ultimoMsg) {
        // Responder al último mensaje de esa categoría (aparece justo debajo)
        msg = await ultimoMsg.reply({
          content: content,
          files: [imagen.url],
          allowedMentions: { parse: [] }
        });
      } else {
        // Primera vez que se envía esta categoría
        msg = await canal.send({
          content: content,
          files: [imagen.url],
          allowedMentions: { parse: [] }
        });
      }

      // Guardar en data.json
      data[usuario.id] = {
        categoria,
        categoriaNombre: ROLES_CARNETS[categoria],
        imagen: imagen.url,
        mensajeId: msg.id,
        fecha: new Date().toISOString()
      };
      saveData(data);

      return interaction.editReply({ 
        content: `✅ Carnet de **${ROLES_CARNETS[categoria]}** subido para <@${usuario.id}>.`, 
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
        try {
          const msgOld = await canal.messages.fetch(data[usuario.id].mensajeId);
          await msgOld.delete();
        } catch (e) {
          console.log('No se pudo borrar carnet anterior:', e.message);
        }
        delete data[usuario.id];
        saveData(data);
      }

      // Buscar dónde poner el nuevo carnet
      const { ultimoMsg, esPrimera } = await encontrarUltimoDeCategoria(canal, categoria, data);

      let content;
      if (esPrimera) {
        content = `# ${ROLES_CARNETS[categoria]}\n<<@${usuario.id}>`;
      } else {
        content = `<<@${usuario.id}>`;
      }

      let msg;
      if (ultimoMsg) {
        msg = await ultimoMsg.reply({
          content: content,
          files: [imagen.url],
          allowedMentions: { parse: [] }
        });
      } else {
        msg = await canal.send({
          content: content,
          files: [imagen.url],
          allowedMentions: { parse: [] }
        });
      }

      data[usuario.id] = {
        categoria,
        categoriaNombre: ROLES_CARNETS[categoria],
        imagen: imagen.url,
        mensajeId: msg.id,
        fecha: new Date().toISOString()
      };
      saveData(data);

      return interaction.editReply({ 
        content: `✅ Carnet agregado para <@${usuario.id}>.`, 
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

      try {
        const msgOld = await canal.messages.fetch(data[usuario.id].mensajeId);
        await msgOld.delete();
      } catch (e) {
        console.log('No se pudo borrar mensaje:', e.message);
      }

      delete data[usuario.id];
      saveData(data);

      return interaction.editReply({ 
        content: `✅ Carnet de <@${usuario.id}> eliminado. Usa \`/organizar\` si necesitas reordenar.`, 
        flags: MessageFlags.Ephemeral 
      });
    }

    // ===== /ORGANIZAR =====
    if (interaction.commandName === 'organizar') {
      if (!interaction.member.roles.cache.some(r => ROLES_ADMIN.includes(r.id))) {
        return safeReply(interaction, { content: '❌ Acceso denegado.', flags: MessageFlags.Ephemeral });
      }

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const canal = await client.channels.fetch(CANAL_CARNETS);

      // Obtener todos los carnets del canal
      const mensajes = await canal.messages.fetch({ limit: 100 });
      const msgsArray = Array.from(mensajes.values()).reverse();
      
      const carnets = [];
      for (const msg of msgsArray) {
        if (msg.attachments.size === 0) continue;
        const entry = Object.entries(data).find(([uid, info]) => info.mensajeId === msg.id);
        if (entry) {
          carnets.push({
            userId: entry[0],
            ...entry[1],
            msg: msg
          });
        }
      }

      console.log(`Organizando ${carnets.length} carnets...`);

      // Borrar todos
      for (const c of carnets) {
        try {
          await c.msg.delete();
          console.log(`Borrado: ${c.userId}`);
        } catch (e) {
          console.error(`Error borrando ${c.userId}:`, e.message);
        }
      }

      // Reenviar en orden por categoría
      const nuevoData = {};
      
      for (const catId of CATEGORIA_ORDEN) {
        const lista = carnets.filter(c => c.categoria === catId);
        if (lista.length === 0) continue;

        let primera = true;
        for (const c of lista) {
          let content;
          if (primera) {
            content = `# ${ROLES_CARNETS[catId]}\n<<@${c.userId}>`;
            primera = false;
          } else {
            content = `<<@${c.userId}>`;
          }

          try {
            const nuevoMsg = await canal.send({
              content: content,
              files: [c.imagen],
              allowedMentions: { parse: [] }
            });
            
            nuevoData[c.userId] = {
              categoria: c.categoria,
              categoriaNombre: c.categoriaNombre,
              imagen: c.imagen,
              mensajeId: nuevoMsg.id,
              fecha: c.fecha
            };
            console.log(`✅ Reenviado: ${c.userId}`);
          } catch (e) {
            console.error(`❌ Error reenviando ${c.userId}:`, e.message);
          }
        }
      }

      // Actualizar data.json
      for (const [uid, info] of Object.entries(nuevoData)) {
        data[uid] = info;
      }
      for (const uid of Object.keys(data)) {
        if (!nuevoData[uid]) delete data[uid];
      }
      saveData(data);

      return interaction.editReply({ 
        content: `✅ Canal organizado. ${Object.keys(nuevoData).length} carnets reubicados.`, 
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
