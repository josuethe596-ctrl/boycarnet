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

// ===== CANAL DE CARNETS =====
const CANAL_CARNETS = '1444812609441501275';

// ===== ARCHIVO =====
const DATA_FILE = './data.json';

// ===== ROLES / SECCIONES =====
const ROLES_CARNETS = {
  '1249081905631203419': 'Commissioned Officers',
  '1465107741550051369': 'Warrant Officers',
  '1249072506850246819': 'Staff Non-Commissioned Officers',
  '1249076967156875265': 'Non-Commissioned Officers',
  '1249080467198836787': 'Junior Enlisted'
};

// ===== DATA =====
function loadData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE));
  } catch {
    fs.writeFileSync(DATA_FILE, '{}');
    return {};
  }
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ===== SAFE REPLY =====
async function safeReply(interaction, options) {
  try {
    if (interaction.replied || interaction.deferred) {
      return await interaction.followUp(options);
    } else {
      return await interaction.reply(options);
    }
  } catch (err) {
    console.error(err);
  }
}

// ===== COMANDOS =====
const commands = [
  new SlashCommandBuilder()
    .setName('carnet')
    .setDescription('Subir carnet militar')
    .addAttachmentOption(option =>
      option
        .setName('imagen')
        .setDescription('Imagen del carnet')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('categoria')
        .setDescription('Selecciona la categoria del carnet')
        .setRequired(true)
        .addChoices(
          {
            name: 'Commissioned Officers',
            value: '1249081905631203419'
          },
          {
            name: 'Warrant Officers',
            value: '1465107741550051369'
          },
          {
            name: 'Staff Non-Commissioned Officers',
            value: '1249072506850246819'
          },
          {
            name: 'Non-Commissioned Officers',
            value: '1249076967156875265'
          },
          {
            name: 'Junior Enlisted',
            value: '1249080467198836787'
          }
        )
    ),

  new SlashCommandBuilder()
    .setName('mycarnet')
    .setDescription('Ver informacion de tu carnet')
].map(cmd => cmd.toJSON());

// ===== REGISTRAR COMANDOS =====
const rest = new REST({ version: '10' }).setToken(TOKEN);

client.once('ready', async () => {
  console.log('================================');
  console.log('BOT ENCENDIDO');
  console.log(client.user.tag);
  console.log('================================');

  try {
    await rest.put(
      Routes.applicationGuildCommands(
        CLIENT_ID,
        '1123790874741047356'
      ),
      { body: commands }
    );

    await rest.put(
      Routes.applicationGuildCommands(
        CLIENT_ID,
        '1464318287683780836'
      ),
      { body: commands }
    );

    console.log('Comandos registrados correctamente');
  } catch (err) {
    console.error('ERROR REGISTRANDO COMANDOS:', err);
  }
});

// ===== INTERACCIONES =====
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  try {

    // ===== /CARNET =====
    if (interaction.commandName === 'carnet') {

      const imagen = interaction.options.getAttachment('imagen');
      const categoria = interaction.options.getString('categoria');

      if (!imagen.contentType.startsWith('image')) {
        return safeReply(interaction, {
          content: 'Debes subir una imagen valida.',
          flags: MessageFlags.Ephemeral
        });
      }

      await interaction.deferReply({
        flags: MessageFlags.Ephemeral
      });

      const canal = await client.channels.fetch(CANAL_CARNETS);

      if (!canal) {
        return interaction.editReply({
          content: 'No se encontro el canal.'
        });
      }

      // ===== ENVIAR IMAGEN LIMPIA =====
      await canal.send({
        content:
          `# ${ROLES_CARNETS[categoria]}\n` +
          `Subido por: <@${interaction.user.id}>`,
        files: [imagen.url]
      });

      // ===== GUARDAR =====
      const data = loadData();

      data[interaction.user.id] = {
        categoria: categoria,
        categoriaNombre: ROLES_CARNETS[categoria],
        imagen: imagen.url,
        fecha: new Date().toISOString()
      };

      saveData(data);

      return interaction.editReply({
        content: 'Carnet subido correctamente.'
      });
    }

    // ===== /MYCARNET =====
    if (interaction.commandName === 'mycarnet') {

      const data = loadData();

      if (!data[interaction.user.id]) {
        return safeReply(interaction, {
          content: 'No tienes carnet registrado.',
          flags: MessageFlags.Ephemeral
        });
      }

      const carnet = data[interaction.user.id];

      return safeReply(interaction, {
        content:
          `Categoria: ${carnet.categoriaNombre}\n` +
          `${carnet.imagen}`,
        flags: MessageFlags.Ephemeral
      });
    }

  } catch (err) {
    console.error(err);

    try {

      if (interaction.deferred) {
        await interaction.editReply({
          content: 'Ocurrio un error.',
          flags: MessageFlags.Ephemeral
        });
      }

      else if (interaction.replied) {
        await interaction.followUp({
          content: 'Ocurrio un error.',
          flags: MessageFlags.Ephemeral
        });
      }

      else {
        await interaction.reply({
          content: 'Ocurrio un error.',
          flags: MessageFlags.Ephemeral
        });
      }

    } catch {}
  }
});

// ===== LOGIN =====
client.login(TOKEN);
