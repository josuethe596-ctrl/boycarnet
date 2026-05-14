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

// ===== ORDEN DE RANGOS (de más alto a más bajo) =====
// LTC → MAJ → CPT → FLT → SLT → WO-02 → WO-01 → MS → GS → SS → SGT → CPL → LCPL → PFC → PVT
const RANGO_ORDEN = [
  '1249070554330169456',  // 1. LTC (Lieutenant Colonel)
  '1249071682476314716',  // 2. MAJ (Major)
  '1249072776480952430',  // 3. CPT (Captain)
  '1249073570932330647',  // 4. FLT (Flight Lieutenant)
  '1465109878744940667',  // 5. SLT (Second Lieutenant)
  '1249074305438978150',  // 6. WO-02 (Warrant Officer 2)
  '1465108847633895456',  // 7. WO-01 (Warrant Officer 1)
  '1249075344410153061',  // 8. MS (Master Sergeant)
  '1249076492147626044',  // 9. GS (Gunnery Sergeant)
  '1249076802312212500',  // 10. SS (Staff Sergeant)
  '1249077129384165450',  // 11. SGT (Sergeant)
  '1249078185077772409',  // 12. CPL (Corporal)
  '1249078391530061855',  // 13. LCPL (Lance Corporal)
  // PFC (Private First Class) - sin ID, se maneja como fallback
  '1249078539135877169'   // 14. PVT (Private)
];

// Nombres de rangos
const RANGO_NOMBRES = {
  '1249070554330169456': 'LTC',
  '1249071682476314716': 'MAJ',
  '1249072776480952430': 'CPT',
  '1249073570932330647': 'FLT',
  '1465109878744940667': 'SLT',
  '1249074305438978150': 'WO-02',
  '1465108847633895456': 'WO-01',
  '1249075344410153061': 'MS',
  '1249076492147626044': 'GS',
  '1249076802312212500': 'SS',
  '1249077129384165450': 'SGT',
  '1249078185077772409': 'CPL',
  '1249078391530061855': 'LCPL',
  '1249078539135877169': 'PVT'
};

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

// ===== OBTENER RANGO DE UN USUARIO =====
function obtenerRangoUsuario(member) {
  if (!member || !member.roles) return null;
  for (const rangoId of RANGO_ORDEN) {
    if (member.roles.cache.has(rangoId)) return rangoId;
  }
  return null; // Sin rango = último
}

// ===== POSICIÓN DEL RANGO =====
function obtenerPosicionRango(rangoId) {
  const pos = RANGO_ORDEN.indexOf(rangoId);
  return pos === -1 ? 999 : pos;
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
    .setDescription('Reorganizar carnets por rango (admin)')
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

      // Obtener rango del usuario
      const member = await interaction.guild.members.fetch(usuario.id).catch(() => null);
      const rangoId = obtenerRangoUsuario(member);

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

      // Buscar último carnet de esta categoría
      const mensajes = await canal.messages.fetch({ limit: 100 });
      let ultimoMsgCategoria = null;
      let hayCategoria = false;
      
      for (const [msgId, msg] of mensajes) {
        if (msg.attachments.size === 0) continue;
        const entry = Object.entries(data).find(([uid, info]) => info.mensajeId === msgId);
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

      // Guardar en data.json (con rangoId para ordenar)
      data[usuario.id] = {
        categoria,
        categoriaNombre: ROLES_CARNETS[categoria],
        rangoId: rangoId,
        imagen: imagen.url,
        mensajeId: msg.id,
        fecha: new Date().toISOString()
      };
      saveData(data);

      const rangoNombre = rangoId ? RANGO_NOMBRES[rangoId] : 'Sin rango';
      
      return interaction.editReply({ 
        content: `✅ Carnet de **${ROLES_CARNETS[categoria]}** subido para <@${usuario.id}>.\n🎖️ Rango detectado: **${rangoNombre}**\n💡 Usa \`/organizar\` para ordenar por rango.`, 
        flags: MessageFlags.Ephemeral 
      });
    }

    // ===== /INGRESO =====
    if (interaction
