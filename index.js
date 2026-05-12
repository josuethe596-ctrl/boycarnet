const { 
  Client, 
  GatewayIntentBits, 
  REST, 
  Routes, 
  SlashCommandBuilder, 
  EmbedBuilder, 
  AttachmentBuilder,
  PermissionFlagsBits
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
const GUILD_PRINCIPAL = '1499948089287381127';
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
    const defaultData = { activos: {}, bajas: {}, ultimoNumero: 0 };
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
  const rangos = ['COL', 'MAJ', 'CPT', 'LT', 'WO-1', 'WO-2', 'WO-3', 'SPC', 'SGT', 'CPL', 'LCPL', 'PFC', 'PVT'];
  for (const rango of rangos) {
    const rolRango = member.roles.cache.find(r => 
      r.name.toUpperCase().includes(rango) || r.name.toUpperCase().startsWith(rango)
    );
    if (rolRango) return rango;
  }
  return 'PVT';
}

function formatearMatricula(numero) {
  return 'UH-' + numero.toString().padStart(2, '0');
}

function obtenerSiguienteMatricula(matriculasData) {
  const numerosActivos = Object.values(matriculasData.activos).map(m => m.numero).sort((a, b) => a - b);
  let siguiente = 1;
  for (const num of numerosActivos) {
    if (num === siguiente) siguiente++;
    else if (num > siguiente) break;
  }
  return siguiente;
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
    .setDescription('Sistema de matriculas (callsigns)')
    .addSubcommand(o => o.setName('lista').setDescription('Ver lista de matriculas activas'))
    .addSubcommand(o => o.setName('asignar').setDescription('Asignar matricula a un miembro').addUserOption(u => u.setName('usuario').setDescription('Usuario').setRequired(true)).addStringOption(s => s.setName('nombre').setDescription('Nombre del marine').setRequired(true)))
    .addSubcommand(o => o.setName('baja').setDescription('Dar de baja un miembro').addStringOption(s => s.setName('matricula').setDescription('Matricula UH-XX').setRequired(true)))
    .addSubcommand(o => o.setName('reactivar').setDescription('Reactivar un miembro dado de baja').addStringOption(s => s.setName('matricula').setDescription('Matricula UH-XX').setRequired(true)))
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

// ===== GENERAR CANVAS CARNET =====
async function generarCarnetCanvas(datos) {
  const { nombreCompleto, fotoKey, rango, payGrade, especialidad, regimientoKey, fechaIngreso, fechaExpiracion, matricula, userId } = datos;

  const regimientoData = REGIMIENTOS[regimientoKey];
  const fotoURL = FOTOS_SOLDADO[fotoKey];

  const canvas = createCanvas(800, 1200);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, 800, 1200);

  ctx.fillStyle = '#8B0000';
  ctx.fillRect(0, 0, 800, 40);
  ctx.fillRect(0, 1160, 800, 40);

  ctx.fillStyle = '#8B0000';
  [[40, 40, 60], [760, 40, 60], [40, 1160, 60], [760, 1160, 60]].forEach(([x, y, r]) => {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  });

  ctx.strokeStyle = '#8B0000'; ctx.lineWidth = 4;
  ctx.strokeRect(30, 30, 740, 1140);

  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 22px Arial'; ctx.textAlign = 'center';
  ctx.fillText('UNITED STATES MARINE CORPS', 400, 75);
  ctx.fillStyle = '#c0c0c0'; ctx.font = '16px Arial';
  ctx.fillText('OFFICIAL IDENTIFICATION CARD', 400, 95);

  if (matricula) {
    ctx.fillStyle = '#D4AF37'; ctx.font = 'bold 18px Arial';
    ctx.fillText('CALLSIGN: ' + matricula, 400, 115);
  }

  try {
    const fotoImage = await loadImage(fotoURL);
    const fotoX = 60, fotoY = 140, fotoW = 280, fotoH = 350;
    const ratio = Math.max(fotoW / fotoImage.width, fotoH / fotoImage.height);
    const shiftX = (fotoW - fotoImage.width * ratio) / 2;
    const shiftY = (fotoH - fotoImage.height * ratio) / 2;
    ctx.drawImage(fotoImage, 0, 0, fotoImage.width, fotoImage.height, fotoX + shiftX, fotoY + shiftY, fotoImage.width * ratio, fotoImage.height * ratio);
    ctx.strokeStyle = '#D4AF37'; ctx.lineWidth = 4;
    ctx.strokeRect(fotoX, fotoY, fotoW, fotoH);
  } catch (imgErr) {
    ctx.fillStyle = '#333'; ctx.fillRect(60, 140, 280, 350);
    ctx.fillStyle = '#ff4444'; ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center';
    ctx.fillText('IMAGEN NO DISPONIBLE', 200, 315);
  }

  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 26px Arial'; ctx.textAlign = 'center';
  const nombreUpper = nombreCompleto.toUpperCase();
  const partes = nombreUpper.split(' ');
  if (nombreUpper.length > 22) {
    const mitad = Math.ceil(partes.length / 2);
    ctx.fillText(partes.slice(0, mitad).join(' '), 200, 520);
    ctx.fillText(partes.slice(mitad).join(' '), 200, 550);
  } else {
    ctx.fillText(nombreUpper, 200, 535);
  }

  const xDer = 400; let yPos = 160;
  function dibujarCampo(titulo, valor, color) {
    if (!color) color = '#FFD700';
    ctx.fillStyle = '#888888'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'left';
    ctx.fillText(titulo.toUpperCase(), xDer, yPos);
    ctx.fillStyle = color; ctx.font = 'bold 30px Arial';
    ctx.fillText(valor.toUpperCase(), xDer, yPos + 32);
    ctx.strokeStyle = '#8B0000'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(xDer, yPos + 42); ctx.lineTo(740, yPos + 42); ctx.stroke();
    yPos += 72;
  }

  dibujarCampo('RANK', rango);
  dibujarCampo('PAY GRADE', payGrade);
  dibujarCampo('MOS / SPECIALTY', especialidad);
  dibujarCampo('DATE OF ENTRY', fechaIngreso);
  dibujarCampo('EXPIRATION DATE', fechaExpiracion, '#ff6666');
  dibujarCampo('UNIT / REGIMENT', regimientoData.abreviatura, '#ffffff');

  ctx.save(); ctx.translate(22, 720); ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = '#8B0000'; ctx.font = 'bold 36px Arial'; ctx.textAlign = 'center';
  ctx.fillText('SEMPER FIDELIS', 0, 0); ctx.restore();

  ctx.beginPath(); ctx.arc(400, 760, 100, 0, Math.PI * 2);
  ctx.strokeStyle = '#D4AF37'; ctx.lineWidth = 6; ctx.stroke();
  ctx.beginPath(); ctx.arc(400, 760, 88, 0, Math.PI * 2);
  ctx.fillStyle = '#1a1a1a'; ctx.fill();
  ctx.fillStyle = '#D4AF37'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center';
  ctx.fillText('UNITED STATES', 400, 740);
  ctx.font = 'bold 22px Arial'; ctx.fillText('MARINE CORPS', 400, 765);
  ctx.font = 'bold 12px Arial'; ctx.fillText('SINCE 1775', 400, 790);

  try {
    const logoImage = await loadImage(regimientoData.logo);
    const logoX = 580, logoY = 680, logoSize = 140;
    ctx.beginPath(); ctx.arc(logoX + logoSize/2, logoY + logoSize/2, logoSize/2 + 5, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1a1a'; ctx.fill();
    ctx.strokeStyle = '#D4AF37'; ctx.lineWidth = 3; ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.arc(logoX + logoSize/2, logoY + logoSize/2, logoSize/2, 0, Math.PI * 2); ctx.clip();
    ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize); ctx.restore();
    ctx.fillStyle = '#D4AF37'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center';
    ctx.fillText(regimientoData.abreviatura, logoX + logoSize/2, logoY + logoSize + 20);
  } catch (logoErr) {
    ctx.fillStyle = '#D4AF37'; ctx.font = 'bold 18px Arial'; ctx.textAlign = 'center';
    ctx.fillText(regimientoData.abreviatura, 650, 750);
  }

  ctx.fillStyle = '#3C3B6E'; ctx.fillRect(60, 1040, 80, 55);
  ctx.fillStyle = '#B22234';
  for (let i = 0; i < 7; i += 2) ctx.fillRect(140, 1040 + (i * 8), 40, 8);
  ctx.fillStyle = '#FFFFFF';
  for (let i = 1; i < 6; i += 2) ctx.fillRect(140, 1040 + (i * 8), 40, 8);
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 6; col++) {
      ctx.beginPath(); ctx.arc(68 + (col * 12), 1048 + (row * 10), 2, 0, Math.PI * 2); ctx.fill();
    }
  }

  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 44px Arial'; ctx.textAlign = 'left';
  ctx.fillText('MARINES', 155, 1075);
  ctx.fillStyle = '#aaaaaa'; ctx.font = '13px Arial';
  ctx.fillText('THE OFFICIAL WEBSITE OF THE UNITED', 155, 1095);
  ctx.fillText('STATES MARINE CORPS', 155, 1110);

  ctx.fillStyle = '#ffffff'; const barX = 620;
  for (let i = 0; i < 35; i++) {
    const ancho = (i % 3 === 0) ? 4 : (i % 2 === 0 ? 3 : 2);
    const gap = (i % 5 === 0) ? 6 : 4;
    ctx.fillRect(barX + (i * gap), 940, ancho, 100);
  }
  ctx.font = 'bold 14px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#aaaaaa';
  ctx.fillText('ID: USMC-' + userId.slice(-8).toUpperCase(), barX + 80, 1055);

  ctx.fillStyle = '#D4AF37'; ctx.beginPath(); ctx.roundRect(680, 1040, 90, 55, 10); ctx.fill();
  ctx.fillStyle = '#8B6914'; ctx.beginPath(); ctx.roundRect(685, 1045, 80, 45, 8); ctx.fill();
  ctx.strokeStyle = '#D4AF37'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(695, 1055); ctx.lineTo(755, 1055);
  ctx.moveTo(695, 1068); ctx.lineTo(755, 1068); ctx.stroke();

  ctx.fillStyle = '#666666'; ctx.font = '10px Arial'; ctx.textAlign = 'right';
  ctx.fillText('CARD ID: ' + userId + ' | USMC OFFICIAL', 780, 1145);

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
        return safeReply(interaction, { content: 'No tienes permiso para usar este comando.', ephemeral: true });
      }

      if (data[userId]) {
        return safeReply(interaction, { content: 'Ya tienes un carnet generado. Usa /mycarnet para verlo.', ephemeral: true });
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
        const siguienteNumero = obtenerSiguienteMatricula(matriculasData);
        matricula = formatearMatricula(siguienteNumero);
        matriculasData.activos[userId] = {
          numero: siguienteNumero,
          matricula: matricula,
          nombre: nombreCompleto,
          userId: userId,
          fechaAsignacion: new Date().toISOString()
        };
        matriculasData.ultimoNumero = Math.max(matriculasData.ultimoNumero, siguienteNumero);
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
        .setColor(0x8B0000)
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
        return safeReply(interaction, { content: 'No tienes permiso para usar este comando.', ephemeral: true });
      }

      if (!data[userId]) {
        return safeReply(interaction, { content: 'No tienes un carnet generado. Usa /carnet para crear uno.', ephemeral: true });
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
        .setColor(0x8B0000)
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
        return safeReply(interaction, { content: 'Acceso denegado. Comando exclusivo para personal autorizado.', ephemeral: true });
      }

      const subcommand = interaction.options.getSubcommand();

      if (subcommand === 'ver') {
        await interaction.deferReply({ ephemeral: true });
        const usuario = interaction.options.getUser('usuario');

        if (!data[usuario.id]) {
          return interaction.editReply({ content: 'Este usuario no tiene carnet generado.' });
        }

        const carnetData = data[usuario.id];
        const matricula = carnetData.matricula || (matriculasData.activos[usuario.id]?.matricula || 'Sin asignar');
        const regimientoData = REGIMIENTOS[carnetData.regimiento];

        const embed = new EmbedBuilder()
          .setColor(0x8B0000)
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
        await interaction.deferReply({ ephemeral: true });
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
        await interaction.deferReply({ ephemeral: true });

        const carnets = Object.entries(data);
        if (carnets.length === 0) {
          return interaction.editReply({ content: 'No hay carnets registrados.' });
        }

        const lineas = carnets.map(([id, info]) => {
          const matricula = info.matricula || (matriculasData.activos[id]?.matricula || 'N/A');
          return '`' + matricula + '` | **' + info.nombre + '** | ' + info.rango + ' | ' + REGIMIENTOS[info.regimiento].abreviatura;
        });

        const embed = new EmbedBuilder()
          .setColor(0x8B0000)
          .setTitle('LISTA DE CARNETS - ' + carnets.length + ' REGISTROS')
          .setDescription(lineas.join('\n'))
          .setFooter({ text: 'Panel de Administracion' });

        return interaction.editReply({ embeds: [embed] });
      }
    }

    // ===== MATRICULAS =====
    if (interaction.commandName === 'matriculas') {
      const subcommand = interaction.options.getSubcommand();

      if (subcommand === 'lista') {
        await interaction.deferReply();

        const activos = Object.entries(matriculasData.activos);
        if (activos.length === 0) {
          return interaction.editReply({ content: 'No hay matriculas activas.' });
        }

        const cupula = [];
        const soldados = [];

        activos.forEach(([uid, info]) => {
          const linea = '`' + info.matricula + '` **' + info.nombre + '** <@' + uid + '>';
          if (info.numero <= 9) cupula.push(linea);
          else soldados.push(linea);
        });

        const embed = new EmbedBuilder()
          .setColor(0x8B0000)
          .setTitle('LIGHTS ARMORED AIRLINES (AIR)')
          .setDescription('Lista de callsigns para los miembros de la faccion.')
          .addFields(
            { name: 'Miembros de la cupula', value: cupula.join('\n') || 'Sin asignar', inline: false },
            { name: 'Miembros soldados', value: soldados.join('\n') || 'Sin asignar', inline: false }
          )
          .setFooter({ text: 'Total activos: ' + activos.length });

        return interaction.editReply({ embeds: [embed] });
      }

      if (subcommand === 'asignar') {
        if (!tieneAlgunRol(interaction.member, ROLES_ADMIN)) {
          return safeReply(interaction, { content: 'Acceso denegado.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });
        const usuario = interaction.options.getUser('usuario');
        const nombre = interaction.options.getString('nombre');

        if (matriculasData.activos[usuario.id]) {
          return interaction.editReply({ content: 'Este usuario ya tiene una matricula asignada: ' + matriculasData.activos[usuario.id].matricula });
        }

        const siguienteNumero = obtenerSiguienteMatricula(matriculasData);
        const matricula = formatearMatricula(siguienteNumero);

        matriculasData.activos[usuario.id] = {
          numero: siguienteNumero,
          matricula: matricula,
          nombre: nombre,
          userId: usuario.id,
          fechaAsignacion: new Date().toISOString()
        };
        matriculasData.ultimoNumero = Math.max(matriculasData.ultimoNumero, siguienteNumero);
        saveMatriculas(matriculasData);

        const hiloLogs = await obtenerCanalHilo(CANAL_LOGS);
        if (hiloLogs && hiloLogs.isTextBased()) {
          const logEmbed = new EmbedBuilder()
            .setColor(0x8B0000)
            .setTitle('NUEVA MATRICULA ASIGNADA')
            .setDescription(
              'Matricula: **' + matricula + '**\n' +
              'Nombre: **' + nombre + '**\n' +
              'Usuario: <@' + usuario.id + '>\n' +
              'Asignado por: <@' + interaction.user.id + '>'
            )
            .setTimestamp();
          hiloLogs.send({ embeds: [logEmbed] }).catch(() => {});
        }

        return interaction.editReply({ content: 'Matricula **' + matricula + '** asignada a <@' + usuario.id + '> (' + nombre + ').' });
      }

      if (subcommand === 'baja') {
        if (!tieneAlgunRol(interaction.member, ROLES_ADMIN)) {
          return safeReply(interaction, { content: 'Acceso denegado.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });
        const matriculaInput = interaction.options.getString('matricula').toUpperCase();

        const entrada = Object.entries(matriculasData.activos).find(([uid, info]) => info.matricula === matriculaInput);

        if (!entrada) {
          return interaction.editReply({ content: 'No se encontro ningun miembro activo con la matricula ' + matriculaInput + '.' });
        }

        const [uid, info] = entrada;
        matriculasData.bajas[uid] = {
          ...info,
          fechaBaja: new Date().toISOString(),
          motivo: 'Baja voluntaria/administrativa'
        };
        delete matriculasData.activos[uid];
        saveMatriculas(matriculasData);

        const hiloLogs = await obtenerCanalHilo(CANAL_LOGS);
        if (hiloLogs && hiloLogs.isTextBased()) {
          const logEmbed = new EmbedBuilder()
            .setColor(0x8B0000)
            .setTitle('BAJA DE MATRICULA')
            .setDescription(
              'Matricula: **' + matriculaInput + '**\n' +
              'Nombre: **' + info.nombre + '**\n' +
              'Usuario: <@' + uid + '>\n' +
              'Dado de baja por: <@' + interaction.user.id + '>'
            )
            .setTimestamp();
          hiloLogs.send({ embeds: [logEmbed] }).catch(() => {});
        }

        return interaction.editReply({ content: 'Matricula **' + matriculaInput + '** (' + info.nombre + ') dada de baja correctamente.' });
      }

      if (subcommand === 'reactivar') {
        if (!tieneAlgunRol(interaction.member, ROLES_ADMIN)) {
          return safeReply(interaction, { content: 'Acceso denegado.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });
        const matriculaInput = interaction.options.getString('matricula').toUpperCase();

        const entrada = Object.entries(matriculasData.bajas).find(([uid, info]) => info.matricula === matriculaInput);

        if (!entrada) {
          return interaction.editReply({ content: 'No se encontro ningun miembro dado de baja con la matricula ' + matriculaInput + '.' });
        }

        const [uid, info] = entrada;

        const numeroOcupado = Object.values(matriculasData.activos).some(m => m.numero === info.numero);
        if (numeroOcupado) {
          const nuevoNumero = obtenerSiguienteMatricula(matriculasData);
          const nuevaMatricula = formatearMatricula(nuevoNumero);
          info.numero = nuevoNumero;
          info.matricula = nuevaMatricula;
          info.matriculaAnterior = matriculaInput;
        }

        matriculasData.activos[uid] = {
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
            .setColor(0x8B0000)
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

      if (subcommand === 'historial') {
        if (!tieneAlgunRol(interaction.member, ROLES_ADMIN)) {
          return safeReply(interaction, { content: 'Acceso denegado.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const bajas = Object.entries(matriculasData.bajas);
        if (bajas.length === 0) {
          return interaction.editReply({ content: 'No hay historial de bajas.' });
        }

        const lineas = bajas.map(([uid, info]) => {
          const fecha = new Date(info.fechaBaja).toLocaleDateString('es-ES');
          return '`' + info.matricula + '` **' + info.nombre + '** | Baja: ' + fecha + ' | ' + (info.motivo || 'Sin motivo');
        });

        const embed = new EmbedBuilder()
          .setColor(0x8B0000)
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
        await interaction.editReply({ content: 'Se produjo un error en el sistema.', ephemeral: true });
      } else if (interaction.replied) {
        await interaction.followUp({ content: 'Se produjo un error en el sistema.', ephemeral: true });
      } else {
        await interaction.reply({ content: 'Se produjo un error en el sistema.', ephemeral: true });
      }
    } catch (replyErr) {
      console.error('No se pudo responder:', replyErr.message);
    }
  }
});

// ===== LOGIN =====
client.login(TOKEN);
