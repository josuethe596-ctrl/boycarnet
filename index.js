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
const CANAL_MATRICULAS = '1249106306162233405';
const GUILD_IDS = ['1123790874741047356', '1464318287683780836'];

// ===== ROLES DE RANGO =====
const ROLES_RANGO = [
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

// ===== ADMIN ROLES =====
const ROLES_ADMIN = ['1249089576270698452','1249089640632422470'];

// ===== DATA =====
const DATA_FILE = './matriculas.json';
function loadData() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE)); } 
  catch { 
    const defaultData = {ala1:{},ala2:{}};
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData));
    return defaultData; 
  }
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
  for (const rangoId of ROLES_RANGO) {
    if (member.roles.cache.has(rangoId)) return rangoId;
  }
  return null;
}

// ===== GENERAR TEXTO DE LA LISTA =====
async function generarListaTexto(guild, data) {
  let texto = `Lista de callsigns para los miembros de la facción.\nLights Armored Vehicles (LAV)\n\n`;
  
  // Procesar ambas alas
  for (const alaKey of ['ala1', 'ala2']) {
    const alaData = data[alaKey];
    const alaNombre = alaKey === 'ala1' ? 'Ala Primera' : 'Ala Segunda';
    
    if (Object.keys(alaData).length === 0) continue;
    
    texto += `═══ ${alaNombre} ═══\n\n`;
    
    // Separar cúpula (01-06) y soldados (07+)
    const cupula = [];
    const soldados = [];
    
    for (const [numero, info] of Object.entries(alaData)) {
      const num = parseInt(numero);
      if (num <= 6) {
        cupula.push({ numero, ...info });
      } else {
        soldados.push({ numero, ...info });
      }
    }
    
    // Ordenar por número
    cupula.sort((a, b) => parseInt(a.numero) - parseInt(b.numero));
    soldados.sort((a, b) => parseInt(a.numero) - parseInt(b.numero));
    
    // CÚPULA
    if (cupula.length > 0) {
      texto += `Miembros de la cúpula:\n\n`;
      
      for (const m of cupula) {
        const member = await guild.members.fetch(m.userId).catch(() => null);
        const rangoId = obtenerRangoUsuario(member);
        
        if (rangoId) {
          texto += `<@&${rangoId}>\n\n`;
        } else {
          texto += `\n`;
        }
        
        const discordName = member ? member.user.username : 'Usuario desconocido';
        texto += `LAV-${m.numero.padStart(2, '0')} ${discordName}\n\n`;
      }
    }
    
    // SOLDADOS
    if (soldados.length > 0) {
      texto += `Miembros soldados:\n\n`;
      
      for (const m of soldados) {
        const member = await guild.members.fetch(m.userId).catch(() => null);
        const rangoId = obtenerRangoUsuario(member);
        
        if (rangoId) {
          texto += `<@&${rangoId}>\n\n`;
        } else {
          texto += `\n`;
        }
        
        const discordName = member ? member.user.username : 'Usuario desconocido';
        texto += `LAV-${m.numero.padStart(2, '0')} ${discordName}\n\n`;
      }
    }
    
    texto += `\n`;
  }
  
  return texto;
}

// ===== ACTUALIZAR MENSAJE EN CANAL =====
async function actualizarMensajeMatriculas(canal, guild, data) {
  try {
    // Buscar mensaje existente
    const mensajes = await canal.messages.fetch({ limit: 20 });
    let msgExistente = null;
    
    for (const [msgId, msg] of mensajes) {
      if (msg.author.id === CLIENT_ID && msg.content.includes('Lista de callsigns')) {
        msgExistente = msg;
        break;
      }
    }
    
    // Generar texto
    const texto = await generarListaTexto(guild, data);
    
    if (msgExistente) {
      await msgExistente.edit(texto);
      console.log('Mensaje de matrículas actualizado');
      return msgExistente.id;
    } else {
      const nuevoMsg = await canal.send(texto);
      console.log('Nuevo mensaje de matrículas creado');
      return nuevoMsg.id;
    }
  } catch (err) {
    console.error('Error actualizando matrículas:', err);
    return null;
  }
}

// ===== COMANDOS =====
const commands = [
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

    // ===== /MATRICULA =====
    if (interaction.commandName === 'matricula') {
      const numero = interaction.options.getString('numero').padStart(2, '0');
      const usuario = interaction.options.getUser('usuario');
      const ala = interaction.options.getString('ala');

      if (!usuario) {
        return safeReply(interaction, { content: '❌ Usuario no válido.', flags: MessageFlags.Ephemeral });
      }

      // Validar número
      const numInt = parseInt(numero);
      if (isNaN(numInt) || numInt < 1 || numInt > 33) {
        return safeReply(interaction, { content: '❌ Número debe ser entre 01 y 33.', flags: MessageFlags.Ephemeral });
      }

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      // Verificar si número ya está ocupado
      if (data[ala][numero]) {
        return interaction.editReply({ 
          content: `❌ El número ${numero} ya está asignado a <@${data[ala][numero].userId}>.`, 
          flags: MessageFlags.Ephemeral 
        });
      }

      // Verificar si usuario ya tiene matrícula en esta ala
      const existente = Object.entries(data[ala]).find(([n, info]) => info.userId === usuario.id);
      if (existente) {
        delete data[ala][existente[0]];
      }

      // Asignar
      data[ala][numero] = {
        userId: usuario.id,
        fecha: new Date().toISOString()
      };
      saveData(data);

      // Actualizar mensaje en canal
      const canal = await client.channels.fetch(CANAL_MATRICULAS);
      await actualizarMensajeMatriculas(canal, interaction.guild, data);

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

      // Buscar matrícula del usuario
      const existente = Object.entries(data[ala]).find(([n, info]) => info.userId === usuario.id);
      if (!existente) {
        return interaction.editReply({ 
          content: `❌ <@${usuario.id}> no tiene matrícula en ${ala === 'ala1' ? 'Ala 1' : 'Ala 2'}.`, 
          flags: MessageFlags.Ephemeral 
        });
      }

      delete data[ala][existente[0]];
      saveData(data);

      const canal = await client.channels.fetch(CANAL_MATRICULAS);
      await actualizarMensajeMatriculas(canal, interaction.guild, data);

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

      // Verificar si nuevo número está ocupado
      if (data[ala][nuevoNumero]) {
        return interaction.editReply({ 
          content: `❌ El número ${nuevoNumero} ya está ocupado por <@${data[ala][nuevoNumero].userId}>.`, 
          flags: MessageFlags.Ephemeral 
        });
      }

      // Buscar matrícula actual
      const existente = Object.entries(data[ala]).find(([n, info]) => info.userId === usuario.id);
      if (!existente) {
        return interaction.editReply({ 
          content: `❌ <@${usuario.id}> no tiene matrícula en ${ala === 'ala1' ? 'Ala 1' : 'Ala 2'}.`, 
          flags: MessageFlags.Ephemeral 
        });
      }

      const numeroAnterior = existente[0];

      // Cambiar
      delete data[ala][numeroAnterior];
      data[ala][nuevoNumero] = {
        userId: usuario.id,
        fecha: new Date().toISOString()
      };
      saveData(data);

      const canal = await client.channels.fetch(CANAL_MATRICULAS);
      await actualizarMensajeMatriculas(canal, interaction.guild, data);

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
        const entry = Object.entries(data[ala]).find(([n, info]) => info.userId === userId);
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
      const rangoId = obtenerRangoUsuario(member);
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
