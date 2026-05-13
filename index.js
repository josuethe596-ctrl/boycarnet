const { 
  Client, 
  GatewayIntentBits, 
  REST, 
  Routes, 
  SlashCommandBuilder, 
  AttachmentBuilder,
  MessageFlags
} = require('discord.js');
const fs = require('fs');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// ===== CONFIG =====
const TOKEN = process.env.TOKEN;
const CLIENT_ID = '1503744068134637750';

// ===== ROLES =====
const ROLES_ADMIN = ['1249089576270696508', '1249089640632422470'];

// ===== CANAL DONDE SE SUBEN LOS CARNETS =====
const CANAL_CARNETS = '1444812609441501275';

// ===== ARCHIVO DE DATOS =====
const DATA_FILE = './data.json';

function loadData() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE)); } 
  catch { fs.writeFileSync(DATA_FILE, '{}'); return {}; }
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ===== SAFE REPLY =====
async function safeReply(interaction, options) {
  try {
    if (interaction.replied || interaction.deferred) return await interaction.followUp(options);
    else return await interaction.reply(options);
  } catch (err) {
    console.error('Error en safeReply:', err.message);
  }
}

// ===== COMANDOS =====
const commands = [
  new SlashCommandBuilder()
    .setName('carnet')
    .setDescription('Sube tu carnet y asigna su sección')
    .addAttachmentOption(option =>
      option.setName('imagen')
        .setDescription('Selecciona la imagen de tu carnet')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('rol')
        .setDescription('Selecciona la sección/rol del carnet')
        .setRequired(true)
        .addChoices(
          { name: 'Commised Officer', value: '1249081905631203419' },
          { name: 'Staff Commised Officer', value: '1465107741550051369' },
          { name: 'Junior Enlisted', value: '1249072506850246819' },
          { name: 'Enlisted', value: '1249076967156875265' },
          { name: 'Otros', value: '1249080467198836787' }
        )
    ),
  new SlashCommandBuilder()
    .setName('mycarnet')
    .setDescription('Ver tus datos de carnet (opcional)'),
  new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Panel de administracion')
].map(c => c.toJSON());

// ===== REGISTRAR COMANDOS =====
const rest = new REST({ version: '10' }).setToken(TOKEN);

client.once('ready', async () => {
  console.log('Bot iniciado correctamente');
  try {
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, '1123790874741047356'), { body: commands });
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, '1464318287683780836'), { body: commands });
    console.log('Comandos registrados');
  } catch (err) {
    console.error('ERROR REGISTRANDO COMANDOS:', err.message);
  }
});

// ===== INTERACCIONES =====
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const userId = interaction.user.id;

  try {
    // ===== CARNET =====
    if (interaction.commandName === 'carnet') {
      const attachment = interaction.options.getAttachment('imagen');
      const rolElegido = interaction.options.getString('rol');

      if (!attachment || !attachment.contentType.startsWith('image')) {
        return safeReply(interaction, { content: 'Debes subir una imagen válida.', flags: MessageFlags.Ephemeral });
      }

      await interaction.deferReply({ ephemeral: true });

      const canalCarnets = await client.channels.fetch(CANAL_CARNETS);
      if (!canalCarnets) return interaction.editReply('No se encontró el canal de carnets.');

      // Enviar la imagen limpia al canal
      await canalCarnets.send({ files: [attachment.url] });

      // Guardar info en data.json
      const data = loadData();
      data[userId] = {
        url: attachment.url,
        rol: rolElegido,
        fecha: new Date().toISOString()
      };
      saveData(data);

      return interaction.editReply({ content: 'Carnet subido correctamente al canal.', flags: MessageFlags.Ephemeral });
    }

    // ===== MYCARNET (opcional) =====
    if (interaction.commandName === 'mycarnet') {
      const data = loadData();
      const info = data[userId];
      if (!info) return safeReply(interaction, { content: 'No has subido ningún carnet aún.', flags: MessageFlags.Ephemeral });

      return safeReply(interaction, { content: `Tu carnet:\nRol: ${info.rol}\nURL: ${info.url}`, flags: MessageFlags.Ephemeral });
    }

  } catch (err) {
    console.error('ERROR:', err);
    try {
      if (interaction.deferred) await interaction.editReply({ content: 'Se produjo un error.', flags: MessageFlags.Ephemeral });
      else if (interaction.replied) await interaction.followUp({ content: 'Se produjo un error.', flags: MessageFlags.Ephemeral });
      else await interaction.reply({ content: 'Se produjo un error.', flags: MessageFlags.Ephemeral });
    } catch {}
  }
});

// ===== LOGIN =====
client.login(TOKEN);
