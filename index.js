const { 
  Client, 
  GatewayIntentBits, 
  REST, 
  Routes, 
  SlashCommandBuilder, 
  EmbedBuilder, 
  AttachmentBuilder,
  PermissionFlagsBits,
  MessageFlags
} = require('discord.js');
const fs = require('fs');
const { createCanvas, loadImage } = require('@napi-rs/canvas');

// ===== PROTECCION ANTI-CRASH =====
process.on('uncaughtException', err => console.error('ERROR GLOBAL:', err));
process.on('unhandledRejection', err => console.error('PROMISE ERROR:', err));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// ===== CONFIG =====
const TOKEN = process.env.TOKEN;
const CLIENT_ID = '1503744068134637750';

// ===== GUILDS =====
const GUILD_PRINCIPAL = '1123790874741047356';
const GUILD_STAFF = '1464318287683780836';

// ===== ROLES =====
const ROL_USUARIO = '1249089172308885576';
const ROLES_ADMIN = ['1249089576270696508', '1249089640632422470'];

// ===== CANAL LOGS (hilo de foro en servidor staff) =====
const CANAL_LOGS = '1469913999192752178';

// ===== IMAGENES DE SOLDADOS =====
const FOTOS_SOLDADO = {
  'soldado1': 'https://media.discordapp.net/attachments/1500299269855379610/1503540408242802738/8d71445b-3453-4e76-948d-90a2cdb2010b.png?ex=6a03b89f&is=6a02671f&hm=b33e70dab9fefcf078c055aa0844182a609edb8d8dc45bda6bc2cb0896ac63ad&=&format=webp&quality=lossless',
  'soldado2': 'https://media.discordapp.net/attachments/1500299269855379610/1503541583914733628/aa466a4f-4dc0-4d0f-8d18-5e7c686cbc64.png?ex=6a03b9b8&is=6a026838&hm=a95fa74a495adc2a9bbaf2af34ff82899ed7f00469035d1e66c96ad5893e0420&=&format=webp&quality=lossless',
  'soldado3': 'https://media.discordapp.net/attachments/1500299269855379610/1503541820867739648/461db43f-e68c-447b-9e12-3258f6141164.png?ex=6a03b9f0&is=6a026870&hm=1943f9864dfdbe9d2e23787e106769046d7bb435bbd63ead8eb1d04c884d3088&=&format=webp&quality=lossless',
  'soldado4': 'https://media.discordapp.net/attachments/1500299269855379610/1503543886537166889/86901073-03f5-407e-a9c8-0640a54c88eb.png?ex=6a03bbdd&is=6a026a5d&hm=56199df5e89844786af92ba69729a2f11b5f563daa6959cb147854fef7d56e84&=&format=webp&quality=lossless',
  'soldado5': 'https://media.discordapp.net/attachments/1500299269855379610/1503544447323996170/58a2b2e4-a1c4-4c1f-a778-744858aeafe8.png?ex=6a03bc62&is=6a026ae2&hm=e4586c4b3f385a37a905d45492846b39267b02591cfef5f1be9a723a0d28c097&=&format=webp&quality=lossless',
  'soldado6': 'https://media.discordapp.net/attachments/1500299269855379610/1503546826710581248/c632e67d-eb7f-449a-bad4-ebe620f8d936.png?ex=6a03be9a&is=6a026d1a&hm=c93fcbc2ba237562df592e32140407f9616b57f9919e569f2233ff1f8220ad6f&=&format=webp&quality=lossless',
  'soldado7': 'https://media.discordapp.net/attachments/1500299269855379610/1503546852463743098/a9ab0a26-7b2c-4440-919a-4f1818656c76.png?ex=6a03bea0&is=6a026d20&hm=6d63432d36f9c24ab3cb38fe6b0a67d6a94d870de955030044765bcc84b6b367&=&format=webp&quality=lossless',
  'soldado8': 'https://media.discordapp.net/attachments/1500299269855379610/1503549951886626847/b5a5c496-0ab2-493a-a072-f4baf8fe7a08.png?ex=6a03c183&is=6a027003&hm=9d3d94227af2f912ff864422f71501d1c9b2e70db9fa96513b4132c1943d1fcb&=&format=webp&quality=lossless'
};

// ===== REGIMIENTOS =====
const REGIMIENTOS = {
  '3rd_marines': {
    nombre: '3rd Marine Division',
    abreviatura: '3rd MARDIV',
    logo: 'https://media.discordapp.net/attachments/1464318898609586339/1468827872591479009/3DMARDIV_Vector_Caltrap.png?ex=6a03574e&is=6a0205ce&hm=a15959ec843c6603171187549f0ccec53abe7e646aa1ec5cc562a85ff64a7462&=&format=webp&quality=lossless&width=980&height=978'
  },
  '1st_raiders': {
    nombre: '1st Regiment Marine Raiders',
    abreviatura: '1st Raiders',
    logo: 'https://media.discordapp.net/attachments/1464319159222538333/1467258914784673995/image.png?ex=6a0390d9&is=6a023f59&hm=164e7b0c7a9edc07be622130a93c312e7884f27e9bfb76d5e550021e372a4bf3&=&format=webp&quality=lossless'
  },
  '3rd_aircraft': {
    nombre: '3rd Marine Aircraft Wing',
    abreviatura: '3rd MAW',
    logo: 'https://media.discordapp.net/attachments/1464848436007538760/1467510044751827134/image.png?ex=6a03293b&is=6a01d7bb&hm=d9b0b7fd06eab0ad32088ce34b607bc0a6b04001178f445ab9f8a9b485a2fcde&=&format=webp&quality=lossless'
  },
  '3rd_littoral': {
    nombre: '3rd Marine Littoral Regiment',
    abreviatura: '3rd MLR',
    logo: 'https://media.discordapp.net/attachments/1467255078221250652/1467255835779534988/image.png?ex=6a038dfb&is=6a023c7b&hm=51859d6567072b9090cc8308fe4780d614d32459531d8b2a8ad55d6391a5135a&=&format=webp&quality=lossless'
  },
  'clr3': {
    nombre: 'Combat Logistics Regiment 3',
    abreviatura: 'CLR-3',
    logo: 'https://media.discordapp.net/attachments/1465025861269852399/1467520645465378917/image.png?ex=6a03331b&is=6a01e19b&hm=48ae53319cc6d03f0a19b1fb29aa2939f97e34615f2c431930187fd1449eb430&=&format=webp&quality=lossless'
  },
  'mcrd_sandiego': {
    nombre: 'Marine Corps Recruit Depot (San Diego)',
    abreviatura: 'MCRD San Diego',
    logo: 'https://media.discordapp.net/attachments/1464301222470090753/1464312536257269802/image.png?ex=6a0364d2&is=6a021352&hm=f3f74f8f61820b62fa2007a6c7a74458d238ff4a251379f12dcd03e8b565fabd&=&format=webp&quality=lossless'
  }
};

// ===== RANGOS ORDENADOS (de mayor a menor) =====
const RANGOS_ORDEN = ['COL', 'MAJ', 'CPT', 'LT', 'WO-1', 'WO-2', 'WO-3', 'SPC', 'SGT', 'CPL', 'LCPL', 'PFC', 'PVT'];

// ===== ARCHIVOS =====
const DATA_FILE = './data.json';
const MATRICULAS_FILE = './matriculas.json';

function loadData() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE)); } 
  catch { fs.writeFileSync(DATA_FILE, '{}'); return {}; }
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function loadMatriculas() {
  try { return JSON.parse(fs.readFileSync(MATRICULAS_FILE)); } 
  catch { 
    const defaultData = { activos: {}, activos2: {}, bajas: {}, ultimoNumero: 0, ultimoNumero2: 0 };
    fs.writeFileSync(MATRICULAS_FILE, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
}

function saveMatriculas(data) {
  fs.writeFileSync(MATRICULAS_FILE, JSON.stringify(data, null, 2));
}

// ===== FUNCIONES AUXILIARES =====
function tieneAlgunRol(member, rolesArray) {
  return rolesArray.some(rolId => member.roles.cache.has(rolId));
}

function obtenerRango(member) {
  for (const rango of RANGOS_ORDEN) {
    const rolRango = member.roles.cache.find(r => 
      r.name.toUpperCase().includes(rango) || r.name.toUpperCase().startsWith(rango)
    );
    if (rolRango) return rango;
  }
  return 'PVT';
}

function obtenerRangoFull(member) {
  const rango = obtenerRango(member);
  const nombres = {
    'COL': 'Colonel', 'MAJ': 'Major', 'CPT': 'Captain', 'LT': 'Lieutenant',
    'WO-1': 'Warrant Officer 1', 'WO-2': 'Chief Warrant Officer 2', 'WO-3': 'Chief Warrant Officer 3',
    'SPC': 'Specialist', 'SGT': 'Sergeant', 'CPL': 'Corporal',
    'LCPL': 'Lance Corporal', 'PFC': 'Private First Class', 'PVT': 'Private'
  };
  return nombres[rango] || rango;
}

function formatearMatricula(numero) {
  return 'LAV-' + numero.toString().padStart(2, '0');
}

function obtenerSiguienteMatricula(targetData, ultimoNumero) {
  const numerosActivos = Object.values(targetData).map(m => m.numero).sort((a, b) => a - b);
  let siguiente = 1;
  for (const num of numerosActivos) {
    if (num === siguiente) siguiente++;
    else if (num > siguiente) break;
  }
  return Math.max(siguiente, ultimoNumero + 1);
}

async function obtenerCanalHilo(channelId) {
  try {
    for (const guild of client.guilds.cache.values()) {
      const canal = guild.channels.cache.get(channelId);
      if (canal) {
        if (canal.isThread && canal.isThread() && canal.archived) {
          try { await canal.setArchived(false); } catch(e) {}
        }
        return canal;
      }
    }
    let canal = await client.channels.fetch(channelId, { force: false });
    if (canal && canal.isThread && canal.isThread() && canal.archived) {
      try { await canal.setArchived(false); } catch(e) {}
    }
    return canal;
  } catch (err) {
    console.error('Error al obtener canal/hilo ' + channelId + ':', err.message);
    return null;
  }
}

// ===== COMANDOS =====
const commands = [
  new SlashCommandBuilder()
    .setName('carnet')
    .setDescription('Generar tu carnet de identificacion militar')
    .addStringOption(o => 
      o.setName('nombre_completo')
        .setDescription('Nombre completo del marine')
        .setRequired(true)
        .setMaxLength(40)
    )
    .addStringOption(o => 
      o.setName('foto_soldado')
        .setDescription('Elige tu foto de soldado')
        .setRequired(true)
        .addChoices(
          { name: 'Soldado 1', value: 'soldado1' },
          { name: 'Soldado 2', value: 'soldado2' },
          { name: 'Soldado 3', value: 'soldado3' },
          { name: 'Soldado 4', value: 'soldado4' },
          { name: 'Soldado 5', value: 'soldado5' },
          { name: 'Cupula de la faccion', value: 'soldado6' },
          { name: 'Cupula', value: 'soldado7' },
          { name: 'Fuerzas Especiales', value: 'soldado8' }
        )
    )
    .addStringOption(o => 
      o.setName('rango')
        .setDescription('Tu rango')
        .setRequired(true)
        .addChoices(
          { name: 'Private (PVT)', value: 'PVT' },
          { name: 'Private First Class (PFC)', value: 'PFC' },
          { name: 'Lance Corporal (LCPL)', value: 'LCPL' },
          { name: 'Corporal (CPL)', value: 'CPL' },
          { name: 'Sergeant (SGT)', value: 'SGT' },
          { name: 'Staff Sergeant (SSGT)', value: 'SSGT' },
          { name: 'Gunnery Sergeant (GYSGT)', value: 'GYSGT' },
          { name: 'Master Sergeant (MSGT)', value: 'MSGT' },
          { name: 'Warrant Officer 1 (WO-1)', value: 'WO-1' },
          { name: 'Chief Warrant Officer 2 (CWO-2)', value: 'CWO-2' },
          { name: 'Second Lieutenant (2LT)', value: '2LT' },
          { name: 'First Lieutenant (1LT)', value: '1LT' },
          { name: 'Captain (CPT)', value: 'CPT' },
          { name: 'Major (MAJ)', value: 'MAJ' },
          { name: 'Lieutenant Colonel (LTCOL)', value: 'LTCOL' },
        )
    )
    .addStringOption(o => 
      o.setName('pay_grade')
        .setDescription('Grado de pago')
        .setRequired(true)
        .addChoices(
          { name: 'E-1', value: 'E-1' },
          { name: 'E-2', value: 'E-2' },
          { name: 'E-3', value: 'E-3' },
          { name: 'E-4', value: 'E-4' },
          { name: 'E-5', value: 'E-5' },
          { name: 'E-6', value: 'E-6' },
          { name: 'E-7', value: 'E-7' },
          { name: 'E-8', value: 'E-8' },
          { name: 'E-9', value: 'E-9' },
          { name: 'W-1', value: 'W-1' },
          { name: 'W-2', value: 'W-2' },
          { name: 'W-3', value: 'W-3' },
          { name: 'W-4', value: 'W-4' },
          { name: 'W-5', value: 'W-5' },
          { name: 'O-1', value: 'O-1' },
          { name: 'O-2', value: 'O-2' },
          { name: 'O-3', value: 'O-3' },
          { name: 'O-4', value: 'O-4' },
          { name: 'O-5', value: 'O-5' },
          { name: 'O-6', value: 'O-6' },
          { name: 'O-7', value: 'O-7' },
          { name: 'O-8', value: 'O-8' },
          { name: 'O-9', value: 'O-9' },
          { name: 'O-10', value: 'O-10' }
        )
    )
    .addStringOption(o => 
      o.setName('especialidad')
        .setDescription('Tu MOS o especialidad')
        .setRequired(true)
        .setMaxLength(30)
    )
    .addStringOption(o => 
      o.setName('regimiento')
        .setDescription('Selecciona tu regimiento')
        .setRequired(true)
        .addChoices(
          { name: '3rd Marine Division', value: '3rd_marines' },
          { name: '1st Regiment Marine Raiders', value: '1st_raiders' },
          { name: '3rd Marine Aircraft Wing', value: '3rd_aircraft' },
          { name: '3rd Marine Littoral Regiment', value: '3rd_littoral' },
          { name: 'Combat Logistics Regiment 3', value: 'clr3' },
          { name: 'Marine Corps Recruit Depot (San Diego)', value: 'mcrd_sandiego' }
        )
    )
    .addStringOption(o => 
      o.setName('fecha_ingreso')
        .setDescription('Fecha de ingreso (DD/MM/AA)')
        .setRequired(true)
    )
    .addStringOption(o => 
      o.setName('fecha_expiracion')
        .setDescription('Fecha de expiracion (DD/MM/AA)')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('mycarnet')
    .setDescription('Ver tu carnet de identificacion'),

  new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Panel de administracion de carnets')
    .addSubcommand(o => o.setName('ver').setDescription('Ver carnet de un usuario').addUserOption(u => u.setName('usuario').setDescription('Usuario').setRequired(true)))
    .addSubcommand(o => o.setName('eliminar').setDescription('Eliminar carnet de un usuario').addUserOption(u => u.setName('usuario').setDescription('Usuario').setRequired(true)))
    .addSubcommand(o => o.setName('lista').setDescription('Lista de todos los carnets')),

  new SlashCommandBuilder()
    .setName('matriculas')
    .setDescription('Sistema de matriculas LAV (Lights Armored Vehicles)')
    .addSubcommand(o => o.setName('lista').setDescription('Ver lista 1 de matriculas activas'))
    .addSubcommand(o => o.setName('lista2').setDescription('Ver lista 2 de matriculas activas'))
    .addSubcommand(o => o.setName('asignar').setDescription('Asignar matricula a un miembro')
      .addUserOption(u => u.setName('usuario').setDescription('Usuario').setRequired(true))
      .addStringOption(s => s.setName('lista').setDescription('Lista (1 o 2)').setRequired(false)
        .addChoices({name:'Lista 1',value:'1'},{name:'Lista 2',value:'2'}))
      .addStringOption(s => s.setName('rango').setDescription('Rango para asignar matricula por rango').setRequired(false)
        .addChoices(
          {name:'SGT - Sergeant',value:'SGT'},{name:'CPL - Corporal',value:'CPL'},
          {name:'LCPL - Lance Corporal',value:'LCPL'},{name:'PFC - Private First Class',value:'PFC'},
          {name:'PVT - Private',value:'PVT'}
        )))
    .addSubcommand(o => o.setName('baja').setDescription('Dar de baja un miembro')
      .addStringOption(s => s.setName('matricula').setDescription('Matricula LAV-XX').setRequired(true))
      .addStringOption(s => s.setName('lista').setDescription('Lista (1 o 2)').setRequired(false)
        .addChoices({name:'Lista 1',value:'1'},{name:'Lista 2',value:'2'})))
    .addSubcommand(o => o.setName('reactivar').setDescription('Reactivar un miembro dado de baja')
      .addStringOption(s => s.setName('matricula').setDescription('Matricula LAV-XX').setRequired(true)))
    .addSubcommand(o => o.setName('historial').setDescription('Ver historial de bajas'))
].map(c => c.toJSON());

// ===== REGISTRAR COMANDOS =====
const rest = new REST({ version: '10' }).setToken(TOKEN);

client.once('ready', async () => {
  console.log('========================================');
  console.log('Bot USMC Carnets iniciado correctamente');
  console.log('Bot tag:', client.user.tag);
  console.log('Bot ID:', client.user.id);
  console.log('Servidores:', client.guilds.cache.map(g => g.name + ' (' + g.id + ')').join(', '));
  console.log('========================================');

  try {
    console.log('Registrando comandos en PRINCIPAL (' + GUILD_PRINCIPAL + ')...');
    const resultPrincipal = await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_PRINCIPAL), { body: commands });
    console.log('Comandos registrados en PRINCIPAL:', resultPrincipal.length);

    console.log('Registrando comandos en STAFF (' + GUILD_STAFF + ')...');
    const resultStaff = await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_STAFF), { body: commands });
    console.log('Comandos registrados en STAFF:', resultStaff.length);

    console.log('========================================');
    console.log('TOTAL COMANDOS REGISTRADOS:', commands.length);
    console.log('========================================');
  } catch (err) {
    console.error('ERROR REGISTRANDO COMANDOS:');
    console.error(err.message);
    console.error(err.stack);
  }
});

// ===== SAFE REPLY =====
async function safeReply(interaction, options) {
  try {
    if (interaction.replied || interaction.deferred) {
      return await interaction.followUp(options);
    } else {
      return await interaction.reply(options);
    }
  } catch (err) {
    console.error('Error en safeReply:', err.message);
  }
}

// ===== NUEVO DISEÑO DE CARNET PROFESIONAL =====
async function generarCarnetCanvas(datos) {
  const { nombreCompleto, fotoKey, rango, payGrade, especialidad, regimientoKey, fechaIngreso, fechaExpiracion, matricula, userId } = datos;

  const regimientoData = REGIMIENTOS[regimientoKey];
  const fotoURL = FOTOS_SOLDADO[fotoKey];

  const W = 1200;
  const H = 750;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, H);

  const headerH = 160;
  ctx.fillStyle = '#1B4F72';
  ctx.fillRect(0, 0, W, headerH);

  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.fillRect(0, headerH, W, 4);

  try {
    const logoImage = await loadImage(regimientoData.logo);
    const logoSize = 110;
    const logoX = 40;
    const logoY = 25;

    ctx.beginPath();
    ctx.arc(logoX + logoSize/2, logoY + logoSize/2, logoSize/2 + 8, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(logoX + logoSize/2, logoY + logoSize/2, logoSize/2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(logoX + logoSize/2, logoY + logoSize/2, logoSize/2 + 4, 0, Math.PI * 2);
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 3;
    ctx.stroke();
  } catch (logoErr) {
    ctx.beginPath();
    ctx.arc(95, 80, 55, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  ctx.fillStyle = '#D4AF37';
  ctx.font = 'bold 52px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('UNITED STATES', 180, 70);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 56px Arial';
  ctx.fillText('MARINE CORPS', 180, 125);

  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(180, 140);
  ctx.lineTo(700, 140);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = '22px Arial';
  ctx.textAlign = 'right';
  ctx.fillText('OFFICIAL IDENTIFICATION CARD', W - 40, 70);

  ctx.fillStyle = '#D4AF37';
  ctx.font = 'bold 28px Arial';
  ctx.fillText(regimientoData.abreviatura, W - 40, 110);

  const fotoW = 280;
  const fotoH = 380;
  const fotoX = 50;
  const fotoY = 200;

  const gradient = ctx.createLinearGradient(fotoX, fotoY, fotoX + fotoW, fotoY + fotoH);
  gradient.addColorStop(0, '#D4AF37');
  gradient.addColorStop(0.5, '#F4D03F');
  gradient.addColorStop(1, '#D4AF37');
  ctx.fillStyle = gradient;
  ctx.fillRect(fotoX, fotoY, fotoW, fotoH);

  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(fotoX + 8, fotoY + 8, fotoW, fotoH);

  try {
    const fotoImage = await loadImage(fotoURL);
    const ratio = Math.max(fotoW / fotoImage.width, fotoH / fotoImage.height);
    const shiftX = (fotoW - fotoImage.width * ratio) / 2;
    const shiftY = (fotoH - fotoImage.height * ratio) / 2;

    ctx.drawImage(
      fotoImage, 
      0, 0, fotoImage.width, fotoImage.height, 
      fotoX + shiftX, fotoY + shiftY, 
      fotoImage.width * ratio, fotoImage.height * ratio
    );
  } catch (imgErr) {
    ctx.fillStyle = '#333';
    ctx.fillRect(fotoX, fotoY, fotoW, fotoH);
    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('IMAGEN NO DISPONIBLE', fotoX + fotoW/2, fotoY + fotoH/2);
  }

  ctx.strokeStyle = '#1B4F72';
  ctx.lineWidth = 4;
  ctx.strokeRect(fotoX, fotoY, fotoW, fotoH);

  const infoX = 380;
  const infoW = 750;
  let currentY = 210;

  function dibujarCampo(label, value, labelColor, valueColor) {
    if (!labelColor) labelColor = '#1B4F72';
    if (!valueColor) valueColor = '#2C3E50';
    ctx.fillStyle = labelColor;
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(label.toUpperCase(), infoX, currentY);

    ctx.fillStyle = valueColor;
    ctx.font = 'bold 32px Arial';
    ctx.fillText(value.toUpperCase(), infoX, currentY + 38);

    ctx.strokeStyle = '#BDC3C7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(infoX, currentY + 52);
    ctx.lineTo(infoX + infoW, currentY + 52);
    ctx.stroke();

    currentY += 75;
  }

  dibujarCampo('NAME', nombreCompleto);
  dibujarCampo('RANK', rango + '  (' + payGrade + ')');
  dibujarCampo('MOS / SPECIALTY', especialidad);
  dibujarCampo('UNIT / REGIMENT', regimientoData.nombre);

  ctx.fillStyle = '#1B4F72';
  ctx.font = 'bold 18px Arial';
  ctx.fillText('DATE OF ENTRY', infoX, currentY);
  ctx.fillText('EXPIRATION DATE', infoX + 350, currentY);

  ctx.fillStyle = '#2C3E50';
  ctx.font = 'bold 28px Arial';
  ctx.fillText(fechaIngreso, infoX, currentY + 35);
  ctx.fillText(fechaExpiracion, infoX + 350, currentY + 35);

  ctx.strokeStyle = '#BDC3C7';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(infoX, currentY + 50);
  ctx.lineTo(infoX + infoW, currentY + 50);
  ctx.stroke();

  currentY += 75;

  if (matricula) {
    ctx.fillStyle = '#1B4F72';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('CALLSIGN', infoX, currentY);

    ctx.fillStyle = '#C0392B';
    ctx.font = 'bold 36px Arial';
    ctx.fillText(matricula, infoX, currentY + 40);

    ctx.strokeStyle = '#BDC3C7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(infoX, currentY + 55);
    ctx.lineTo(infoX + infoW, currentY + 55);
    ctx.stroke();

    currentY += 75;
  }

  ctx.save();
  ctx.translate(W - 50, H/2 + 20);
  ctx.rotate(Math.PI / 2);

  ctx.fillStyle = 'rgba(212, 175, 55, 0.3)';
  ctx.font = 'bold 80px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('USMC', 4, 4);

  ctx.fillStyle = '#D4AF37';
  ctx.font = 'bold 80px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('USMC', 0, 0);
  ctx.restore();

  const footerY = H - 70;

  ctx.fillStyle = '#1B4F72';
  ctx.fillRect(0, footerY, W, 70);

  ctx.fillStyle = '#D4AF37';
  ctx.fillRect(0, footerY, W, 4);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '16px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('SEMPER FIDELIS  |  UNITED STATES MARINE CORPS  |  SINCE 1775', 30, footerY + 40);

  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '14px monospace';
  ctx.textAlign = 'right';
  ctx.fillText('ID: USMC-' + userId.slice(-8).toUpperCase() + ' | CARD ISSUED: ' + fechaIngreso, W - 30, footerY + 40);

  const barX = 50;
  const barY = H - 140;
  ctx.fillStyle = '#2C3E50';
  for (let i = 0; i < 40; i++) {
    const ancho = (i % 3 === 0) ? 4 : (i % 2 === 0 ? 3 : 2);
    const gap = (i % 5 === 0) ? 5 : 3;
    ctx.fillRect(barX + (i * gap), barY, ancho, 45);
  }

  ctx.fillStyle = '#7F8C8D';
  ctx.font = '12px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('USMC-' + userId.slice(-8).toUpperCase(), barX, barY + 60);

  const shieldX = W - 120;
  const shieldY = H - 130;

  ctx.beginPath();
  ctx.arc(shieldX, shieldY, 35, 0, Math.PI * 2);
  ctx.fillStyle = '#D4AF37';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(shieldX, shieldY, 28, 0, Math.PI * 2);
  ctx.fillStyle = '#1B4F72';
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('★', shieldX, shieldY + 5);

  return await canvas.encode('png');
}

// ===== INTERACCIONES =====
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const data = loadData();
  const matriculasData = loadMatriculas();
  const userId = interaction.user.id;

  try {

    // ===== CARNET =====
    if (interaction.commandName === 'carnet') {
      if (!interaction.member.roles.cache.has(ROL_USUARIO)) {
        return safeReply(interaction, { content: 'No tienes permiso para usar este comando.', flags: MessageFlags.Ephemeral });
      }

      if (data[userId]) {
        return safeReply(interaction, { content: 'Ya tienes un carnet generado. Usa /mycarnet para verlo.', flags: MessageFlags.Ephemeral });
      }

      await interaction.deferReply();

      const nombreCompleto = interaction.options.getString('nombre_completo');
      const fotoKey = interaction.options.getString('foto_soldado');
      const rango = interaction.options.getString('rango');
      const payGrade = interaction.options.getString('pay_grade');
      const especialidad = interaction.options.getString('especialidad');
      const regimientoKey = interaction.options.getString('regimiento');
      const fechaIngreso = interaction.options.getString('fecha_ingreso');
      const fechaExpiracion = interaction.options.getString('fecha_expiracion');

      let matricula = null;
      if (!matriculasData.activos[userId]) {
        const siguienteNumero = obtenerSiguienteMatricula(matriculasData.activos, matriculasData.ultimoNumero || 0);
        matricula = formatearMatricula(siguienteNumero);
        matriculasData.activos[userId] = {
          numero: siguienteNumero,
          matricula: matricula,
          nombre: nombreCompleto,
          userId: userId,
          fechaAsignacion: new Date().toISOString()
        };
        matriculasData.ultimoNumero = Math.max(matriculasData.ultimoNumero || 0, siguienteNumero);
        saveMatriculas(matriculasData);
      } else {
        matricula = matriculasData.activos[userId].matricula;
      }

      const buffer = await generarCarnetCanvas({
        nombreCompleto, fotoKey, rango, payGrade, especialidad,
        regimientoKey, fechaIngreso, fechaExpiracion, matricula, userId
      });

      const attachment = new AttachmentBuilder(buffer, { name: 'carnet_' + userId + '.png' });

      data[userId] = {
        nombre: nombreCompleto,
        foto: fotoKey,
        rango: rango,
        payGrade: payGrade,
        especialidad: especialidad,
        regimiento: regimientoKey,
        fechaIngreso: fechaIngreso,
        fechaExpiracion: fechaExpiracion,
        matricula: matricula,
        generadoEn: new Date().toISOString()
      };
      saveData(data);

      const regimientoData = REGIMIENTOS[regimientoKey];
      const embed = new EmbedBuilder()
        .setColor(0x1B4F72)
        .setTitle('CARNET GENERADO')
        .setDescription(
          '**' + nombreCompleto.toUpperCase() + '**\n' +
          'Callsign: **' + matricula + '**\n' +
          'Rango: **' + rango + '** (' + payGrade + ')\n' +
          'Unidad: **' + regimientoData.nombre + '**\n' +
          'MOS: **' + especialidad + '**'
        )
        .setImage('attachment://carnet_' + userId + '.png')
        .setFooter({ text: 'USMC ID: ' + userId.slice(-8) + ' | ' + fechaIngreso + ' - ' + fechaExpiracion });

      return interaction.editReply({ embeds: [embed], files: [attachment] });
    }

    // ===== MYCARNET =====
    if (interaction.commandName === 'mycarnet') {
      if (!interaction.member.roles.cache.has(ROL_USUARIO)) {
        return safeReply(interaction, { content: 'No tienes permiso para usar este comando.', flags: MessageFlags.Ephemeral });
      }

      if (!data[userId]) {
        return safeReply(interaction, { content: 'No tienes un carnet generado. Usa /carnet para crear uno.', flags: MessageFlags.Ephemeral });
      }

      await interaction.deferReply();

      const carnetData = data[userId];
      const matricula = carnetData.matricula || (matriculasData.activos[userId]?.matricula || null);

      const buffer = await generarCarnetCanvas({
        nombreCompleto: carnetData.nombre,
        fotoKey: carnetData.foto,
        rango: carnetData.rango,
        payGrade: carnetData.payGrade,
        especialidad: carnetData.especialidad,
        regimientoKey: carnetData.regimiento,
        fechaIngreso: carnetData.fechaIngreso,
        fechaExpiracion: carnetData.fechaExpiracion,
        matricula: matricula,
        userId: userId
      });

      const attachment = new AttachmentBuilder(buffer, { name: 'carnet_' + userId + '.png' });
      const regimientoData = REGIMIENTOS[carnetData.regimiento];

      const embed = new EmbedBuilder()
        .setColor(0x1B4F72)
        .setTitle('TU CARNET USMC')
        .setDescription(
          '**' + carnetData.nombre.toUpperCase() + '**\n' +
          (matricula ? 'Callsign: **' + matricula + '**\n' : '') +
          'Rango: **' + carnetData.rango + '** (' + carnetData.payGrade + ')\n' +
          'Unidad: **' + regimientoData.nombre + '**\n' +
          'MOS: **' + carnetData.especialidad + '**'
        )
        .setImage('attachment://carnet_' + userId + '.png')
        .setFooter({ text: 'USMC ID: ' + userId.slice(-8) + ' | ' + carnetData.fechaIngreso + ' - ' + carnetData.fechaExpiracion });

      return interaction.editReply({ embeds: [embed], files: [attachment] });
    }

    // ===== ADMIN =====
    if (interaction.commandName === 'admin') {
      if (!tieneAlgunRol(interaction.member, ROLES_ADMIN)) {
        return safeReply(interaction, { content: 'Acceso denegado. Comando exclusivo para personal autorizado.', flags: MessageFlags.Ephemeral });
      }

      const subcommand = interaction.options.getSubcommand();

      if (subcommand === 'ver') {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const usuario = interaction.options.getUser('usuario');

        if (!data[usuario.id]) {
          return interaction.editReply({ content: 'Este usuario no tiene carnet generado.' });
        }

        const carnetData = data[usuario.id];
        const matricula = carnetData.matricula || (matriculasData.activos[usuario.id]?.matricula || 'Sin asignar');
        const regimientoData = REGIMIENTOS[carnetData.regimiento];

        const embed = new EmbedBuilder()
          .setColor(0x1B4F72)
          .setTitle('CARNET DE ' + carnetData.nombre.toUpperCase())
          .addFields(
            { name: 'Callsign', value: matricula, inline: true },
            { name: 'Rango', value: carnetData.rango + ' (' + carnetData.payGrade + ')', inline: true },
            { name: 'MOS', value: carnetData.especialidad, inline: true },
            { name: 'Regimiento', value: regimientoData.nombre, inline: true },
            { name: 'Ingreso', value: carnetData.fechaIngreso, inline: true },
            { name: 'Expiracion', value: carnetData.fechaExpiracion, inline: true },
            { name: 'Generado', value: new Date(carnetData.generadoEn).toLocaleDateString('es-ES'), inline: true }
          )
          .setFooter({ text: 'ID: ' + usuario.id });

        return interaction.editReply({ embeds: [embed] });
      }

      if (subcommand === 'eliminar') {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const usuario = interaction.options.getUser('usuario');

        if (!data[usuario.id]) {
          return interaction.editReply({ content: 'Este usuario no tiene carnet generado.' });
        }

        delete data[usuario.id];
        saveData(data);

        if (matriculasData.activos[usuario.id]) {
          const matriculaInfo = matriculasData.activos[usuario.id];
          matriculasData.bajas[usuario.id] = {
            ...matriculaInfo,
            fechaBaja: new Date().toISOString(),
            motivo: 'Carnet eliminado por admin'
          };
          delete matriculasData.activos[usuario.id];
          saveMatriculas(matriculasData);
        }

        return interaction.editReply({ content: 'Carnet de <@' + usuario.id + '> eliminado correctamente. Matricula dada de baja.' });
      }

      if (subcommand === 'lista') {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const carnets = Object.entries(data);
        if (carnets.length === 0) {
          return interaction.editReply({ content: 'No hay carnets registrados.' });
        }

        const lineas = carnets.map(([id, info]) => {
          const matricula = info.matricula || (matriculasData.activos[id]?.matricula || 'N/A');
          return '`' + matricula + '` | **' + info.nombre + '** | ' + info.rango + ' | ' + REGIMIENTOS[info.regimiento].abreviatura;
        });

        const embed = new EmbedBuilder()
          .setColor(0x1B4F72)
          .setTitle('LISTA DE CARNETS - ' + carnets.length + ' REGISTROS')
          .setDescription(lineas.join('\n'))
          .setFooter({ text: 'Panel de Administracion' });

        return interaction.editReply({ embeds: [embed] });
      }
    }

    // ===== MATRICULAS =====
    if (interaction.commandName === 'matriculas') {
      const subcommand = interaction.options.getSubcommand();

      // Helper function to build matriculas list with rank sections
      async function buildMatriculasEmbed(targetData, listaNum, interaction) {
        const activos = Object.entries(targetData || {});
        if (activos.length === 0) {
          return null;
        }

        // Group by rank
        const porRango = {};
        for (const rango of RANGOS_ORDEN) {
          porRango[rango] = [];
        }

        for (const [uid, info] of activos) {
          const member = interaction.guild.members.cache.get(uid);
          const rango = member ? obtenerRango(member) : (info.rango || 'PVT');
          const rangoFull = member ? obtenerRangoFull(member) : rango;

          porRango[rango].push({
            uid: uid,
            matricula: info.matricula,
            rango: rango,
            rangoFull: rangoFull
          });
        }

        const embed = new EmbedBuilder()
          .setColor(0x1B4F72)
          .setTitle('Lights Armored Vehicles (LAV) - Lista ' + listaNum)
          .setDescription('Lista de callsigns para los miembros de la faccion.');

        // Add fields for each rank that has members
        for (const rango of RANGOS_ORDEN) {
          const miembros = porRango[rango];
          if (miembros.length === 0) continue;

          const rangoEmojis = {
            'COL': '⭐', 'MAJ': '🌟', 'CPT': '💠', 'LT': '🔷',
            'WO-1': '🔹', 'WO-2': '🔹', 'WO-3': '🔹',
            'SPC': '⚡', 'SGT': '🛡️', 'CPL': '⚔️',
            'LCPL': '📌', 'PFC': '📍', 'PVT': '📝'
          };

          const lines = miembros.map(m => 
            '**' + m.matricula + '** <@' + m.uid + '>'
          );

          embed.addFields({
            name: rangoEmojis[rango] + ' ' + rango + ' (' + miembros.length + ')',
            value: lines.join('\n'),
            inline: false
          });
        }

        embed.setFooter({ text: 'Total activos: ' + activos.length + ' | LAV Lista ' + listaNum });
        return embed;
      }

      // ===== LISTA 1 =====
      if (subcommand === 'lista') {
        await interaction.deferReply();

        const embed = await buildMatriculasEmbed(matriculasData.activos, '1', interaction);
        if (!embed) {
          return interaction.editReply({ content: 'No hay matriculas activas en la Lista 1.' });
        }

        return interaction.editReply({ embeds: [embed] });
      }

      // ===== LISTA 2 =====
      if (subcommand === 'lista2') {
        await interaction.deferReply();

        const embed = await buildMatriculasEmbed(matriculasData.activos2, '2', interaction);
        if (!embed) {
          return interaction.editReply({ content: 'No hay matriculas activas en la Lista 2.' });
        }

        return interaction.editReply({ embeds: [embed] });
      }

      // ===== ASIGNAR =====
      if (subcommand === 'asignar') {
        if (!tieneAlgunRol(interaction.member, ROLES_ADMIN)) {
          return safeReply(interaction, { content: 'Acceso denegado.', flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const usuario = interaction.options.getUser('usuario');
        const lista = interaction.options.getString('lista') || '1';
        const rangoAsignar = interaction.options.getString('rango');

        const targetKey = lista === '2' ? 'activos2' : 'activos';
        const targetData = matriculasData[targetKey] || {};
        const ultimoField = lista === '2' ? 'ultimoNumero2' : 'ultimoNumero';

        if (targetData[usuario.id]) {
          return interaction.editReply({ content: 'Este usuario ya tiene una matricula asignada: ' + targetData[usuario.id].matricula });
        }

        let matricula;
        let numero;

        if (rangoAsignar) {
          // Assign by rank: LAV-SGT-01, LAV-CPL-01, etc.
          const rangoPrefix = rangoAsignar;
          const existentes = Object.values(targetData)
            .filter(m => m.rangoAsignado === rangoPrefix)
            .map(m => m.numeroRango || 0)
            .sort((a, b) => a - b);

          let siguienteRangoNum = 1;
          for (const num of existentes) {
            if (num === siguienteRangoNum) siguienteRangoNum++;
            else if (num > siguienteRangoNum) break;
          }

          numero = siguienteRangoNum;
          matricula = 'LAV-' + rangoPrefix + '-' + numero.toString().padStart(2, '0');
        } else {
          // Regular sequential assignment
          numero = obtenerSiguienteMatricula(targetData, matriculasData[ultimoField] || 0);
          matricula = formatearMatricula(numero);
        }

        if (!matriculasData[targetKey]) matriculasData[targetKey] = {};
        matriculasData[targetKey][usuario.id] = {
          numero: numero,
          matricula: matricula,
          nombre: usuario.username,
          userId: usuario.id,
          rangoAsignado: rangoAsignar || null,
          numeroRango: rangoAsignar ? numero : null,
          fechaAsignacion: new Date().toISOString()
        };

        if (!rangoAsignar) {
          matriculasData[ultimoField] = Math.max(matriculasData[ultimoField] || 0, numero);
        }
        saveMatriculas(matriculasData);

        const hiloLogs = await obtenerCanalHilo(CANAL_LOGS);
        if (hiloLogs && hiloLogs.isTextBased()) {
          const logEmbed = new EmbedBuilder()
            .setColor(0x1B4F72)
            .setTitle('NUEVA MATRICULA ASIGNADA')
            .setDescription(
              'Matricula: **' + matricula + '**\n' +
              'Lista: **' + (lista === '2' ? '2' : '1') + '**\n' +
              (rangoAsignar ? 'Tipo: **Por Rango (' + rangoAsignar + ')**\n' : '') +
              'Usuario: <@' + usuario.id + '>\n' +
              'Asignado por: <@' + interaction.user.id + '>'
            )
            .setTimestamp();
          hiloLogs.send({ embeds: [logEmbed] }).catch(() => {});
        }

        return interaction.editReply({ content: 'Matricula **' + matricula + '** asignada a <@' + usuario.id + '> (Lista ' + (lista === '2' ? '2' : '1') + ').' });
      }

      // ===== BAJA =====
      if (subcommand === 'baja') {
        if (!tieneAlgunRol(interaction.member, ROLES_ADMIN)) {
          return safeReply(interaction, { content: 'Acceso denegado.', flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const matriculaInput = interaction.options.getString('matricula').toUpperCase();
        const lista = interaction.options.getString('lista') || '1';

        const targetKey = lista === '2' ? 'activos2' : 'activos';
        const targetData = matriculasData[targetKey] || {};

        const entrada = Object.entries(targetData).find(([uid, info]) => info.matricula === matriculaInput);

        if (!entrada) {
          return interaction.editReply({ content: 'No se encontro ningun miembro activo con la matricula ' + matriculaInput + '.' });
        }

        const [uid, info] = entrada;
        if (!matriculasData.bajas) matriculasData.bajas = {};
        matriculasData.bajas[uid] = {
          ...info,
          lista: lista,
          fechaBaja: new Date().toISOString(),
          motivo: 'Baja voluntaria/administrativa'
        };
        delete targetData[uid];
        saveMatriculas(matriculasData);

        const hiloLogs = await obtenerCanalHilo(CANAL_LOGS);
        if (hiloLogs && hiloLogs.isTextBased()) {
          const logEmbed = new EmbedBuilder()
            .setColor(0x1B4F72)
            .setTitle('BAJA DE MATRICULA')
            .setDescription(
              'Matricula: **' + matriculaInput + '**\n' +
              'Lista: **' + lista + '**\n' +
              'Usuario: <@' + uid + '>\n' +
              'Dado de baja por: <@' + interaction.user.id + '>'
            )
            .setTimestamp();
          hiloLogs.send({ embeds: [logEmbed] }).catch(() => {});
        }

        return interaction.editReply({ content: 'Matricula **' + matriculaInput + '** dada de baja correctamente.' });
      }

      // ===== REACTIVAR =====
      if (subcommand === 'reactivar') {
        if (!tieneAlgunRol(interaction.member, ROLES_ADMIN)) {
          return safeReply(interaction, { content: 'Acceso denegado.', flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const matriculaInput = interaction.options.getString('matricula').toUpperCase();

        const entrada = Object.entries(matriculasData.bajas || {}).find(([uid, info]) => info.matricula === matriculaInput);

        if (!entrada) {
          return interaction.editReply({ content: 'No se encontro ningun miembro dado de baja con la matricula ' + matriculaInput + '.' });
        }

        const [uid, info] = entrada;
        const lista = info.lista || '1';
        const targetKey = lista === '2' ? 'activos2' : 'activos';
        if (!matriculasData[targetKey]) matriculasData[targetKey] = {};

        const numeroOcupado = Object.values(matriculasData[targetKey]).some(m => m.numero === info.numero && m.matricula === info.matricula);
        if (numeroOcupado) {
          const ultimo = lista === '2' ? (matriculasData.ultimoNumero2 || 0) : (matriculasData.ultimoNumero || 0);
          const nuevoNumero = obtenerSiguienteMatricula(matriculasData[targetKey], ultimo);
          const nuevaMatricula = formatearMatricula(nuevoNumero);
          info.numero = nuevoNumero;
          info.matricula = nuevaMatricula;
          info.matriculaAnterior = matriculaInput;
          if (!info.rangoAsignado) {
            matriculasData[lista === '2' ? 'ultimoNumero2' : 'ultimoNumero'] = Math.max(ultimo, nuevoNumero);
          }
        }

        matriculasData[targetKey][uid] = {
          ...info,
          fechaReactivacion: new Date().toISOString()
        };
        delete matriculasData.bajas[uid];
        saveMatriculas(matriculasData);

        const msg = numeroOcupado 
          ? 'Miembro **' + info.nombre + '** reactivado. Nueva matricula: **' + info.matricula + '** (la anterior estaba ocupada).'
          : 'Miembro **' + info.nombre + '** reactivado con matricula **' + info.matricula + '**.';

        const hiloLogs = await obtenerCanalHilo(CANAL_LOGS);
        if (hiloLogs && hiloLogs.isTextBased()) {
          const logEmbed = new EmbedBuilder()
            .setColor(0x1B4F72)
            .setTitle('REACTIVACION DE MATRICULA')
            .setDescription(
              'Matricula: **' + info.matricula + '**\n' +
              'Nombre: **' + info.nombre + '**\n' +
              'Usuario: <@' + uid + '>\n' +
              'Reactivado por: <@' + interaction.user.id + '>'
            )
            .setTimestamp();
          hiloLogs.send({ embeds: [logEmbed] }).catch(() => {});
        }

        return interaction.editReply({ content: msg });
      }

      // ===== HISTORIAL =====
      if (subcommand === 'historial') {
        if (!tieneAlgunRol(interaction.member, ROLES_ADMIN)) {
          return safeReply(interaction, { content: 'Acceso denegado.', flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const bajas = Object.entries(matriculasData.bajas || {});
        if (bajas.length === 0) {
          return interaction.editReply({ content: 'No hay historial de bajas.' });
        }

        const lineas = bajas.map(([uid, info]) => {
          const fecha = new Date(info.fechaBaja).toLocaleDateString('es-ES');
          return '`' + info.matricula + '` **' + info.nombre + '** | Baja: ' + fecha + ' | ' + (info.motivo || 'Sin motivo');
        });

        const embed = new EmbedBuilder()
          .setColor(0x1B4F72)
          .setTitle('HISTORIAL DE BAJAS - ' + bajas.length + ' REGISTROS')
          .setDescription(lineas.join('\n'))
          .setFooter({ text: 'Sistema de Matriculas' });

        return interaction.editReply({ embeds: [embed] });
      }
    }

  } catch (err) {
    console.error('ERROR:', err);
    try {
      if (interaction.deferred) {
        await interaction.editReply({ content: 'Se produjo un error en el sistema.', flags: MessageFlags.Ephemeral });
      } else if (interaction.replied) {
        await interaction.followUp({ content: 'Se produjo un error en el sistema.', flags: MessageFlags.Ephemeral });
      } else {
        await interaction.reply({ content: 'Se produjo un error en el sistema.', flags: MessageFlags.Ephemeral });
      }
    } catch (replyErr) {
      console.error('No se pudo responder:', replyErr.message);
    }
  }
});

// ===== LOGIN =====
client.login(TOKEN);
