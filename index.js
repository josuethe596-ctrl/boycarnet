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

// ===== ROLES / SECCIONES =====
const ROLES_CARNETS = {
  '1249081905631203419': 'Commissioned Officers',
  '1465107741550051369': 'Warrant Officers',
  '1249072506850246819': 'Staff Non-Commissioned Officers',
  '1249076967156875265': 'Non-Commissioned Officers',
  '1249080467198836787': 'Junior Enlisted'
};

// ===== ADMIN ROLES =====
const ROLES_ADMIN = ['1249089576270698','1249089640632422470'];

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
    if (interaction.replied || interaction.deferred) return await interaction.followUp(options);
    else return await interaction.reply(options);
  } catch (err) { console.error(err); }
}

// ===== COMANDOS =====
const commands = [
  new SlashCommandBuilder()
    .setName('carnet')
    .setDescription('Subir tu carnet militar')
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
    .setDescription('Eliminar el carnet de un usuario')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario al que quitar el carnet')
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('mycarnet')
    .setDescription('Ver tu carnet registrado')
].map(cmd => cmd.toJSON());

// ===== REGISTRAR COMANDOS =====
const rest = new REST({ version: '10' }).setToken(TOKEN);
client.once('ready', async () => {
  console.log(`Bot iniciado: ${client.user.tag}`);
  try {
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, '1123790874741047356'), { body: commands });
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, '1464318287683780836'), { body: commands });
    console.log('Comandos registrados correctamente');
  } catch (err) { console.error('ERROR REGISTRANDO COMANDOS:', err); }
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

      if (!imagen.contentType.startsWith('image')) {
        return safeReply(interaction, { content: 'Debes subir una imagen válida.', flags: MessageFlags.Ephemeral });
      }

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const canal = await client.channels.fetch(CANAL_CARNETS);
      if (!canal) return interaction.editReply({ content: 'No se encontró el canal.' });

      // Subir mensaje con nombre de rol y tag del usuario
      const msg = await canal.send({
        content: `# ${ROLES_CARNETS[categoria]}\n<@${interaction.user.id}>`,
        files: [imagen.url]
      });

      // Guardar info en data.json
      data[userId] = {
        categoria,
        categoriaNombre: ROLES_CARNETS[categoria],
        imagen: imagen.url,
        mensajeId: msg.id,
        fecha: new Date().toISOString()
      };
      saveData(data);

      return interaction.editReply({ content: 'Carnet subido correctamente.', flags: MessageFlags.Ephemeral });
    }

    // ===== /INGRESO =====
    if (interaction.commandName === 'ingreso') {
      if (!interaction.member.roles.cache.some(r => ROLES_ADMIN.includes(r.id))) {
        return safeReply(interaction, { content: 'Acceso denegado.', flags: MessageFlags.Ephemeral });
      }

      const usuario = interaction.options.getUser('usuario');
      const imagen = interaction.options.getAttachment('imagen');
      const categoria = interaction.options.getString('categoria');

      if (!imagen.contentType.startsWith('image')) {
        return safeReply(interaction, { content: 'Debes subir una imagen válida.', flags: MessageFlags.Ephemeral });
      }

      const canal = await client.channels.fetch(CANAL_CARNETS);
      if (!canal) return interaction.editReply({ content: 'No se encontró el canal.' });

      const msg = await canal.send({
        content: `# ${ROLES_CARNETS[categoria]}\n<@${usuario.id}>`,
        files: [imagen.url]
      });

      data[usuario.id] = {
        categoria,
        categoriaNombre: ROLES_CARNETS[categoria],
        imagen: imagen.url,
        mensajeId: msg.id,
        fecha: new Date().toISOString()
      };
      saveData(data);

      return safeReply(interaction, { content: `Carnet agregado para ${usuario.username}.`, flags: MessageFlags.Ephemeral });
    }

    // ===== /BAJA =====
    if (interaction.commandName === 'baja') {
      const usuario = interaction.options.getUser('usuario');

      if (!data[usuario.id]) {
        return safeReply(interaction, { content: 'Este usuario no tiene carnet registrado.', flags: MessageFlags.Ephemeral });
      }

      const canal = await client.channels.fetch(CANAL_CARNETS);
      const msgId = data[usuario.id].mensajeId;
      const msg = await canal.messages.fetch(msgId).catch(() => null);
      if (msg) await msg.delete().catch(() => {});

      delete data[usuario.id];
      saveData(data);

      return safeReply(interaction, { content: `Carnet de ${usuario.username} eliminado correctamente.`, flags: MessageFlags.Ephemeral });
    }

    // ===== /MYCARNET =====
    if (interaction.commandName === 'mycarnet') {
      if (!data[userId]) {
        return safeReply(interaction, { content: 'No tienes carnet registrado.', flags: MessageFlags.Ephemeral });
      }
      const carnet = data[userId];
      return safeReply(interaction, { content: `Categoria: ${carnet.categoriaNombre}\n${carnet.imagen}`, flags: MessageFlags.Ephemeral });
    }

  } catch (err) {
    console.error(err);
    try {
      if (interaction.deferred) await interaction.editReply({ content: 'Ocurrió un error.', flags: MessageFlags.Ephemeral });
      else if (interaction.replied) await interaction.followUp({ content: 'Ocurrió un error.', flags: MessageFlags.Ephemeral });
      else await interaction.reply({ content: 'Ocurrió un error.', flags: MessageFlags.Ephemeral });
    } catch {}
  }
});

// ===== LOGIN =====
client.login(TOKEN);
