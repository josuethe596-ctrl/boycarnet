const { 
  Client, 
  GatewayIntentBits, 
  REST, 
  Routes, 
  SlashCommandBuilder 
} = require('discord.js');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = '1500333360344469524';
const GUILD_PRINCIPAL = '1499948089287381127';
const GUILD_STAFF = '1464318287683780836';

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const commands = [
  new SlashCommandBuilder().setName('ping').setDescription('Responde Pong'),
  new SlashCommandBuilder().setName('carnet').setDescription('Generar carnet'),
  new SlashCommandBuilder().setName('mycarnet').setDescription('Ver mi carnet'),
  new SlashCommandBuilder().setName('matriculas').setDescription('Ver matriculas')
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

client.once('ready', async () => {
  console.log('Bot conectado:', client.user.tag);
  console.log('Servidores:', client.guilds.cache.size);

  try {
    console.log('Intentando registrar comandos...');

    // Intentar global primero (más confiable)
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('Comandos registrados GLOBALMENTE');

    // También en guilds específicos
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_PRINCIPAL), { body: [] });
    console.log('Comandos limpiados en PRINCIPAL');

    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_STAFF), { body: [] });
    console.log('Comandos limpiados en STAFF');

    console.log('TOTAL COMANDOS:', commands.length);

  } catch (err) {
    console.error('ERROR:', err.message);
    if (err.code) console.error('CODIGO:', err.code);
    if (err.status) console.error('STATUS:', err.status);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'ping') {
    await interaction.reply('Pong! Bot funcionando correctamente.');
  }
  if (interaction.commandName === 'carnet') {
    await interaction.reply('Comando /carnet en desarrollo...');
  }
  if (interaction.commandName === 'mycarnet') {
    await interaction.reply('Comando /mycarnet en desarrollo...');
  }
  if (interaction.commandName === 'matriculas') {
    await interaction.reply('Comando /matriculas en desarrollo...');
  }
});

client.login(TOKEN);
