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
const CANAL_MATRICULAS = '1249106306162233405';
const GUILD_IDS = ['1123790874741047356', '1464318287683780836'];

// ============================================================
// ===== CARNETS - ROLES / SECCIONES =====
// ============================================================
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

// ===== CARNETS - ORDEN DE RANGOS =====
const RANGO_ORDEN = [
  '1249070554330169456',  // 1. LTC
  '1249071682476314716',  // 2. MAJ
  '1249072078435385354',  // 3. CPT
  '1249072776480952430',  // 4. FLT
  '1249073570932330647',  // 5. SLT
  '1465109878744940667',  // 6. WO-02
  '1249074305438978150',  // 7. WO-01
  '1465108847633895456',  // 8. MS
  '1249075344410153061',  // 9. GS
  '1249076492147626044',  // 10. SS
  '1249076802312212500',  // 11. SGT
  '1249077129384165450',  // 12. CPL
  '1249078185077772409',  // 13. LCPL
  '1249078391530061855',  // 14. PFC
  '1249078539135877169'   // 15. PVT
];

const RANGO_NOMBRES = {
  '1249070554330169456': 'LTC',
  '1249071682476314716': 'MAJ',
  '1249072078435385354': 'CPT',
  '1249072776480952430': 'FLT',
  '1249073570932330647': 'SLT',
  '1465109878744940667': 'WO-02',
  '1249074305438978150': 'WO-01',
  '1465108847633895456': 'MS',
  '1249075344410153061': 'GS',
  '1249076492147626044': 'SS',
  '1249076802312212500': 'SGT',
  '1249077129384165450': 'CPL',
  '1249078185077772409': 'LCPL',
  '1249078391530061855': 'PFC',
  '1249078539135877169': 'PVT'
};

// ===== MATRICULAS - ROLES DE RANGO =====
const ROLES_RANGO_MATRICULA = [
  '1249070554330169456',  // LTC
  '1249071682476314716',  // MAJ
  '1249072078435385354',  // CPT
  '1249072776480952430',  // FLT
  '1249073570932330647',  // SLT
  '1465109878744940667',  // WO-02
  '1249074305438978150',  // WO-01
  '1465108847633895456',  // MS
  '1249075344410153061',  // GS
  '1249076492147626044',  // SS
  '1249076802312212500',  // SGT
  '1249077129384165450',  // CPL
  '1249078185077772409',  // LCPL
  '1249078391530061855',  // PFC
  '1249078539135877169'   // PVT
];

// ===== ADMIN ROLES =====
const ROLES_ADMIN = ['1249089576270698452','1249089640632422470'];

// ===== DATA FILES =====
const DATA_FILE_CARNETS = './data.json';
const DATA_FILE_MATRICULAS = './matriculas.json';

function loadData(file) {
  try { return JSON.parse(fs.readFileSync(file)); } 
  catch { 
    const defaultData = file.includes('matriculas') ? {ala1:{},ala2:{}} : {};
    fs.writeFileSync(file, JSON.stringify(defaultData));
    return defaultData; 
  }
}
function saveData(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }

// ===== SAFE REPLY =====
async function safeReply(interaction, options) {
  try {
    if (interaction.deferred) return await interaction.editReply(options);
    if (interaction.replied) return await interaction.followUp(options);
    else return await interaction.reply(options);
  } catch (err) { console.error('safeReply error:', err); }
}

// ===== OBTENER RANGO (carnets) =====
function obtenerRangoUsuario(member) {
  if (!member || !member.roles) return null;
  for (const rangoId of RANGO_ORDEN) {
    if (member.roles.cache.has(rangoId)) return rangoId;
  }
  return null;
}

function obtenerPosicionRango(rangoId) {
  const pos = RANGO_ORDEN.indexOf(rangoId);
  return pos === -1 ? 999 : pos;
}

// ===== OBTENER RANGO (matriculas) =====
function obtenerRangoMatricula(member) {
  if (!member || !member.roles) return null;
  for (const rangoId of ROLES_RANGO_MATRICULA) {
    if (member.roles.cache.has(rangoId)) return rangoId;
  }
  return null;
}

// ============================================================
// ===== FUNCIONES DE MATRICULAS =====
// ============================================================

async function generarListaMatriculas(guild, data) {
  let texto = `Lista de callsigns para los miembros de la facción.\nLights Armored Vehicles (LAV)\n\n`;
  
  for (const alaKey of ['ala1', 'ala2']) {
    const alaData = data[alaKey];
    const alaNombre = alaKey === 'ala1' ? 'Ala Primera' : 'Ala Segunda';
    
    if (Object.keys(alaData).length === 0) continue;
    
    texto += `═══ ${alaNombre} ═══\n\n`;
    
    const cupula = [];
    const soldados = [];
    
    for (const [numero, info] of Object.entries(alaData)) {
      const num = parseInt(numero);
      if (num <= 6) cupula.push({ numero, ...info });
      else soldados.push({ numero, ...info });
    }
    
    cupula.sort((a, b) => parseInt(a.numero) - parseInt(b.numero));
    soldados.sort((a, b) => parseInt(a.numero) - parseInt(b.numero));
    
    if (cupula.length > 0) {
      texto += `Miembros de la cúpula:\n\n`;
      for (const m of cupula) {
        const member = await guild.members.fetch(m.userId).catch(() => null);
        const rangoId = obtenerRangoMatricula(member);
        if (rangoId) texto += `<@&${rangoId}>\n\n`;
        else texto += `\n`;
        const discordName = member ? member.user.username : 'Usuario desconocido';
        texto += `LAV-${m.numero.padStart(2, '0')} ${discordName}\n\n`;
      }
    }
    
    if (soldados.length > 0) {
      texto += `Miembros soldados:\n\n`;
      for (const m of soldados) {
        const member = await guild.members.fetch(m.userId).catch(() => null);
        const rangoId = obtenerRangoMatricula(member);
        if (rangoId) texto += `<@&${rangoId}>\n\n`;
        else texto += `\n`;
        const discordName = member ? member.user.username : 'Usuario desconocido';
        texto += `LAV-${m.numero.padStart(2, '0')} ${discordName}\n\n`;
      }
    }
    
    texto += `\n`;
  }
  
  return texto;
}

async function actualizarMensajeMatriculas(canal, guild, data) {
  try {
    const mensajes = await canal.messages.fetch({ limit: 20 });
    let msgExistente = null;
    
    for (const [msgId, msg] of mensajes) {
      if (msg.author.id === CLIENT_ID && msg.content.includes('Lista de callsigns')) {
        msgExistente = msg;
        break;
      }
    }
    
    const texto = await generarListaMatriculas(guild, data);
    
    if (msgExistente) {
      await msgExistente.edit(texto);
      return msgExistente.id;
    } else {
      const nuevoMsg = await canal.send(texto);
      return nuevoMsg.id;
    }
  } catch (err) {
    console.error('Error actualizando matrículas:', err);
    return null;
  }
}

// ============================================================
// ===== COMANDOS =====
// ============================================================

const commands = [
  // --- CARNETS ---
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
    .setDescription('Reorganizar carnets por rango (admin)'),
    
  // --- MATRICULAS ---
  new SlashCommandBuilder()
    .setName('matricula')
    .setDescription('Asignar matrícula LAV a un usuario')
    .addStringOption(option =>
      option.setName('numero')
        .setDescription('Número de matrícula (01-33)')
        .setRequired(true)
    )
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario a asignar')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('ala')
        .setDescription('Ala/Regimiento')
        .setRequired(true)
        .addChoices(
          { name: 'Ala 1', value: 'ala1' },
          { name: 'Ala 2', value: 'ala2' }
        )
    ),
  new SlashCommandBuilder()
    .setName('quitarmatricula')
    .setDescription('Quitar matrícula a un usuario (admin)')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario a quitar')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('ala')
        .setDescription('Ala/Regimiento')
        .setRequired(true)
        .addChoices(
          { name: 'Ala 1', value: 'ala1' },
          { name: 'Ala 2', value: 'ala2' }
        )
    ),
  new SlashCommandBuilder()
    .setName('cambiarmatricula')
    .setDescription('Cambiar número de matrícula (admin)')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario a cambiar')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('nuevo_numero')
        .setDescription('Nuevo número')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('ala')
        .setDescription('Ala/Regimiento')
        .setRequired(true)
        .addChoices(
          { name: 'Ala 1', value: 'ala1' },
          { name: 'Ala 2', value: 'ala2' }
        )
    ),
  new SlashCommandBuilder()
    .setName('listamatriculas')
    .setDescription('Ver lista de matrículas'),
  new SlashCommandBuilder()
    .setName('mimatricula')
    .setDescription('Ver tu matrícula')
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

// ============================================================
// ===== INTERACCIONES =====
// ============================================================

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  try {
    const dataCarnets = loadData(DATA_FILE_CARNETS);
    const dataMatriculas = loadData(DATA_FILE_MATRICULAS);
    const userId = interaction.user.id;

    // ==========================================================
    // ===== CARNETS =====
    // ==========================================================

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

      const member = await interaction.guild.members.fetch(usuario.id).catch(() => null);
      const rangoId = obtenerRangoUsuario(member);

      if (dataCarnets[usuario.id]) {
        try {
          const msgOld = await canal.messages.fetch(dataCarnets[usuario.id].mensajeId);
          await msgOld.delete();
        } catch (e) {
          console.log('No se pudo borrar carnet anterior:', e.message);
        }
        delete dataCarnets[usuario.id];
        saveData(DATA_FILE_CARNETS, dataCarnets);
      }

      const mensajes = await canal.messages.fetch({ limit: 100 });
      let ultimoMsgCategoria = null;
      let hayCategoria = false;
      
      for (const [msgId, msg] of mensajes) {
        if (msg.attachments.size === 0) continue;
        const entry = Object.entries(dataCarnets).find(([uid, info]) => info.mensajeId === msgId);
        if (entry && entry[1].categoria === categoria) {
          hayCategoria = true;
          ultimoMsgCategoria = msg;
        }
      }

      let content;
      if (!hayCategoria) {
        content = `# ${ROLES_CARNETS[categoria]}\n<<@${usuario.id}>`;
      } else {
        content = `<<@${usuario.id}>`;
      }

      let msg;
      if (ultimoMsgCategoria) {
        msg = await ultimoMsgCategoria.reply({
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

      dataCarnets[usuario.id] = {
        categoria,
        categoriaNombre: ROLES_CARNETS[categoria],
        rangoId: rangoId,
        imagen: imagen.url,
        mensajeId: msg.id,
        fecha: new Date().toISOString()
      };
      saveData(DATA_FILE_CARNETS, dataCarnets);

      const rangoNombre = rangoId ? RANGO_NOMBRES[rangoId] : 'Sin rango';
      
      return interaction.editReply({ 
        content: `✅ Carnet de **${ROLES_CARNETS[categoria]}** subido para <@${usuario.id}>.\n🎖️ Rango detectado: **${rangoNombre}**\n💡 Usa \`/organizar\` para ordenar por rango.`, 
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

      const member = await interaction.guild.members.fetch(usuario.id).catch(() => null);
      const rangoId = obtenerRangoUsuario(member);

      if (dataCarnets[usuario.id]) {
        try {
          const msgOld = await canal.messages.fetch(dataCarnets[usuario.id].mensajeId);
          await msgOld.delete();
        } catch (e) {
          console.log('No se pudo borrar carnet anterior:', e.message);
        }
        delete dataCarnets[usuario.id];
        saveData(DATA_FILE_CARNETS, dataCarnets);
      }

      const mensajes = await canal.messages.fetch({ limit: 100 });
      let ultimoMsgCategoria = null;
      let hayCategoria = false;
      
      for (const [msgId, msg] of mensajes) {
        if (msg.attachments.size === 0) continue;
        const entry = Object.entries(dataCarnets).find(([uid, info]) => info.mensajeId === msgId);
        if (entry && entry[1].categoria === categoria) {
          hayCategoria = true;
          ultimoMsgCategoria = msg;
        }
      }

      let content;
      if (!hayCategoria) {
        content = `# ${ROLES_CARNETS[categoria]}\n<<@${usuario.id}>`;
      } else {
        content = `<<@${usuario.id}>`;
      }

      let msg;
      if (ultimoMsgCategoria) {
        msg = await ultimoMsgCategoria.reply({
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

      dataCarnets[usuario.id] = {
        categoria,
        categoriaNombre: ROLES_CARNETS[categoria],
        rangoId: rangoId,
        imagen: imagen.url,
        mensajeId: msg.id,
        fecha: new Date().toISOString()
      };
      saveData(DATA_FILE_CARNETS, dataCarnets);

      const rangoNombre = rangoId ? RANGO_NOMBRES[rangoId] : 'Sin rango';

      return interaction.editReply({ 
        content: `✅ Carnet agregado para <@${usuario.id}>.\n🎖️ Rango: **${rangoNombre}**`, 
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

      if (!dataCarnets[usuario.id]) {
        return safeReply(interaction, { content: '❌ Este usuario no tiene carnet registrado.', flags: MessageFlags.Ephemeral });
      }

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const canal = await client.channels.fetch(CANAL_CARNETS);

      try {
        const msgOld = await canal.messages.fetch(dataCarnets[usuario.id].mensajeId);
        await msgOld.delete();
      } catch (e) {
        console.log('No se pudo borrar mensaje:', e.message);
      }

      delete dataCarnets[usuario.id];
      saveData(DATA_FILE_CARNETS, dataCarnets);

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

      const mensajes = await canal.messages.fetch({ limit: 100 });
      const msgsArray = Array.from(mensajes.values()).reverse();
      
      const carnets = [];
      for (const msg of msgsArray) {
        if (msg.attachments.size === 0) continue;
        const entry = Object.entries(dataCarnets).find(([uid, info]) => info.mensajeId === msg.id);
        if (entry) {
          const [uid, info] = entry;
          const member = await canal.guild.members.fetch(uid).catch(() => null);
          const rangoActual = obtenerRangoUsuario(member) || info.rangoId;
          
          carnets.push({
            userId: uid,
            ...info,
            rangoId: rangoActual,
            msg: msg
          });
        }
      }

      console.log(`Organizando ${carnets.length} carnets...`);

      for (const c of carnets) {
        try {
          await c.msg.delete();
          console.log(`Borrado: ${c.userId}`);
        } catch (e) {
          console.error(`Error borrando ${c.userId}:`, e.message);
        }
      }

      const porCategoria = {};
      CATEGORIA_ORDEN.forEach(cat => porCategoria[cat] = []);
      
      for (const c of carnets) {
        if (porCategoria[c.categoria]) {
          porCategoria[c.categoria].push(c);
        }
      }

      const nuevoData = {};
      
      for (const catId of CATEGORIA_ORDEN) {
        const lista = porCategoria[catId];
        if (lista.length === 0) continue;

        lista.sort((a, b) => obtenerPosicionRango(a.rangoId) - obtenerPosicionRango(b.rangoId));

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
              rangoId: c.rangoId,
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

      for (const [uid, info] of Object.entries(nuevoData)) {
        dataCarnets[uid] = info;
      }
      for (const uid of Object.keys(dataCarnets)) {
        if (!nuevoData[uid]) delete dataCarnets[uid];
      }
      saveData(DATA_FILE_CARNETS, dataCarnets);

      return interaction.editReply({ 
        content: `✅ Canal organizado. ${Object.keys(nuevoData).length} carnets ordenados por rango (LTC → PVT).`, 
        flags: MessageFlags.Ephemeral 
      });
    }

    // ===== /MYCARNET =====
    if (interaction.commandName === 'mycarnet') {
      if (!dataCarnets[userId]) {
        return safeReply(interaction, { content: '❌ No tienes carnet registrado.', flags: MessageFlags.Ephemeral });
      }
      const carnet = dataCarnets[userId];
      const rangoNombre = carnet.rangoId ? RANGO_NOMBRES[carnet.rangoId] : 'Sin rango';
      
      return safeReply(interaction, { 
        content: `**Categoría:** ${carnet.categoriaNombre}\n**Rango:** ${rangoNombre}\n**Fecha:** ${new Date(carnet.fecha).toLocaleDateString()}\n${carnet.imagen}`, 
        flags: MessageFlags.Ephemeral 
      });
    }

    // ==========================================================
    // ===== MATRICULAS =====
    // ==========================================================

    // ===== /MATRICULA =====
    if (interaction.commandName === 'matricula') {
      const numero = interaction.options.getString('numero').padStart(2, '0');
      const usuario = interaction.options.getUser('usuario');
      const ala = interaction.options.getString('ala');

      if (!usuario) {
        return safeReply(interaction, { content: '❌ Usuario no válido.', flags: MessageFlags.Ephemeral });
      }

      const numInt = parseInt(numero);
      if (isNaN(numInt) || numInt < 1 || numInt > 33) {
        return safeReply(interaction, { content: '❌ Número debe ser entre 01 y 33.', flags: MessageFlags.Ephemeral });
      }

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      if (dataMatriculas[ala][numero]) {
        return interaction.editReply({ 
          content: `❌ El número ${numero} ya está asignado a <@${dataMatriculas[ala][numero].userId}>.`, 
          flags: MessageFlags.Ephemeral 
        });
      }

      const existente = Object.entries(dataMatriculas[ala]).find(([n, info]) => info.userId === usuario.id);
      if (existente) {
        delete dataMatriculas[ala][existente[0]];
      }

      dataMatriculas[ala][numero] = {
        userId: usuario.id,
        fecha: new Date().toISOString()
      };
      saveData(DATA_FILE_MATRICULAS, dataMatriculas);

      const canal = await client.channels.fetch(CANAL_MATRICULAS);
      await actualizarMensajeMatriculas(canal, interaction.guild, dataMatriculas);

      const tipo = numInt <= 6 ? 'cúpula' : 'soldado';
      
      return interaction.editReply({ 
        content: `✅ Matrícula **LAV-${numero}** asignada a <@${usuario.id}> (${tipo}).\n📋 Lista actualizada en <#${CANAL_MATRICULAS}>.`, 
        flags: MessageFlags.Ephemeral 
      });
    }

    // ===== /QUITARMATRICULA =====
    if (interaction.commandName === 'quitarmatricula') {
      if (!interaction.member.roles.cache.some(r => ROLES_ADMIN.includes(r.id))) {
        return safeReply(interaction, { content: '❌ Acceso denegado.', flags: MessageFlags.Ephemeral });
      }

      const usuario = interaction.options.getUser('usuario');
      const ala = interaction.options.getString('ala');

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const existente = Object.entries(dataMatriculas[ala]).find(([n, info]) => info.userId === usuario.id);
      if (!existente) {
        return interaction.editReply({ 
          content: `❌ <@${usuario.id}> no tiene matrícula en ${ala === 'ala1' ? 'Ala 1' : 'Ala 2'}.`, 
          flags: MessageFlags.Ephemeral 
        });
      }

      delete dataMatriculas[ala][existente[0]];
      saveData(DATA_FILE_MATRICULAS, dataMatriculas);

      const canal = await client.channels.fetch(CANAL_MATRICULAS);
      await actualizarMensajeMatriculas(canal, interaction.guild, dataMatriculas);

      return interaction.editReply({ 
        content: `✅ Matrícula LAV-${existente[0]} quitada a <@${usuario.id}>.\n📋 Lista actualizada.`, 
        flags: MessageFlags.Ephemeral 
      });
    }

    // ===== /CAMBIARMATRICULA =====
    if (interaction.commandName === 'cambiarmatricula') {
      if (!interaction.member.roles.cache.some(r => ROLES_ADMIN.includes(r.id))) {
        return safeReply(interaction, { content: '❌ Acceso denegado.', flags: MessageFlags.Ephemeral });
      }

      const usuario = interaction.options.getUser('usuario');
      const nuevoNumero = interaction.options.getString('nuevo_numero').padStart(2, '0');
      const ala = interaction.options.getString('ala');

      const numInt = parseInt(nuevoNumero);
      if (isNaN(numInt) || numInt < 1 || numInt > 33) {
        return safeReply(interaction, { content: '❌ Número debe ser entre 01 y 33.', flags: MessageFlags.Ephemeral });
      }

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      if (dataMatriculas[ala][nuevoNumero]) {
        return interaction.editReply({ 
          content: `❌ El número ${nuevoNumero} ya está ocupado por <@${dataMatriculas[ala][nuevoNumero].userId}>.`, 
          flags: MessageFlags.Ephemeral 
        });
      }

      const existente = Object.entries(dataMatriculas[ala]).find(([n, info]) => info.userId === usuario.id);
      if (!existente) {
        return interaction.editReply({ 
          content: `❌ <@${usuario.id}> no tiene matrícula en ${ala === 'ala1' ? 'Ala 1' : 'Ala 2'}.`, 
          flags: MessageFlags.Ephemeral 
        });
      }

      const numeroAnterior = existente[0];

      delete dataMatriculas[ala][numeroAnterior];
      dataMatriculas[ala][nuevoNumero] = {
        userId: usuario.id,
        fecha: new Date().toISOString()
      };
      saveData(DATA_FILE_MATRICULAS, dataMatriculas);

      const canal = await client.channels.fetch(CANAL_MATRICULAS);
      await actualizarMensajeMatriculas(canal, interaction.guild, dataMatriculas);

      return interaction.editReply({ 
        content: `✅ Matrícula cambiada de LAV-${numeroAnterior} a **LAV-${nuevoNumero}** para <@${usuario.id}>.\n📋 Lista actualizada.`, 
        flags: MessageFlags.Ephemeral 
      });
    }

    // ===== /LISTAMATRICULAS =====
    if (interaction.commandName === 'listamatriculas') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      
      const canal = await client.channels.fetch(CANAL_MATRICULAS);
      const mensajes = await canal.messages.fetch({ limit: 20 });
      
      let msgLista = null;
      for (const [msgId, msg] of mensajes) {
        if (msg.author.id === CLIENT_ID && msg.content.includes('Lista de callsigns')) {
          msgLista = msg;
          break;
        }
      }

      if (msgLista) {
        return interaction.editReply({ 
          content: `📋 Lista de matrículas: ${msgLista.url}`, 
          flags: MessageFlags.Ephemeral 
        });
      } else {
        return interaction.editReply({ 
          content: '❌ No se encontró la lista. Usa `/matricula` para crearla.', 
          flags: MessageFlags.Ephemeral 
        });
      }
    }

    // ===== /MIMATRICULA =====
    if (interaction.commandName === 'mimatricula') {
      let encontrado = null;
      let alaEncontrada = '';
      
      for (const ala of ['ala1', 'ala2']) {
        const entry = Object.entries(dataMatriculas[ala]).find(([n, info]) => info.userId === userId);
        if (entry) {
          encontrado = entry;
          alaEncontrada = ala;
          break;
        }
      }

      if (!encontrado) {
        return safeReply(interaction, { content: '❌ No tienes matrícula asignada.', flags: MessageFlags.Ephemeral });
      }

      const member = await interaction.guild.members.fetch(userId).catch(() => null);
      const rangoId = obtenerRangoMatricula(member);
      const rangoTexto = rangoId ? `<@&${rangoId}>` : 'Sin rango';

      return safeReply(interaction, { 
        content: `🎖️ Tu matrícula: **LAV-${encontrado[0]}** (${alaEncontrada === 'ala1' ? 'Ala 1' : 'Ala 2'})\n${rangoTexto}\n📅 Asignada: ${new Date(encontrado[1].fecha).toLocaleDateString()}`, 
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
