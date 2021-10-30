const Command = require("../../base/Command.js");
const Permissions = require("../../Settings/Permissions.json");
const Role = require("../../Settings/Role.json");
const Guild = require("../../Settings/Guild.json");
const moment = require("moment");
const GuildRole = require("../../Settings/GuildRole.json");
const Register = require('../../models/kayıt.js');
const Limit = require('../../Settings/Limit.json');
const data = require("../../models/cezalar.js")
const Log = require("../../Settings/Log.json")
const { MessageEmbed } = require("discord.js")
class İsim extends Command {
  constructor(client) {
      super(client, {
          name: "isim",
          description: "Latency and API response times.",
          usage: "isim",
          aliases: ["isim","erkek","kız"]
      });
  }
  async run(message, args, client) {
  
    if(!message.member.roles.cache.has(Permissions.Register.Auth_Roles) && !message.member.hasPermission("VIEW_AUDIT_LOG")) return


  const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
  if (!member) return this.client.yolla("Bir üye etiketle ve tekrardan dene!", message.author, message.channel);
  const nick = args.slice(1).filter(arg => isNaN(arg)).map(arg => arg[0].toUpperCase() + arg.slice(1).toLowerCase()).join(" ");
  if (!nick) return this.client.yolla("Yeni ismi belirtin.", message.author, message.channel);
  if (nick && (await this.client.chatKoruma(nick))) return this.client.yolla('Üyenin kullanıcı ismine reklam veya küfür yazamazsınız lütfen geçerli bir isim girip yeniden deneyiniz.', message.author, message.channel)
  const age = args.slice(1).filter(arg => !isNaN(arg))[0] ?? undefined;
  if (!age || isNaN(age)) return this.client.yolla("Geçerli bir yaş belirtin.", message.author, message.channel);
 if (message.guild.members.cache.has(member.id) && message.member.roles.highest.position <= message.guild.members.cache.get(member.id).roles.highest.position) return this.client.yolla("Kendi rolünden yüksek kişilere işlem uygulayamazsın!", message.author, message.channel)
  if(nick.length > 30) return client.reply(message, "isim ya da yaş ile birlikte toplam 30 karakteri geçecek bir isim giremezsin.")
  if (age < Limit.Age_Limit) return this.client.yolla(`Kayıt ettiğin üyenin yaşı ${Limit.Age_Limit}'(t(d)(a(e)n küçük olamaz.`, message.author, message.channel);
  if (age > 99) return this.client.yolla(`Kayıt ettiğin üyenin yaşı iki basamakdan büyük olamaz.`,message.author, message.channel);
  if (!member.manageable) return this.client.yolla(`Kullanıcı benden yüksek bir pozisyona sahip o yüzden ismini değiştiremiyorum.`, message.author, message.channel)

  await data.find({ user: member.id }).sort({ ihlal: "descending" }).exec(async (err, res) => {
    if(!res) return this.client.yolla(`${member} kullanıcısının ceza bilgisi bulunmuyor.`, message.author, message.channel)

        let filterArr = res.map(x => (x.ceza))
        let chatMute = filterArr.filter(x => x == "Chat Mute").length || 0
        let voiceMute = filterArr.filter(x => x == "Voice Mute").length || 0
        let jail = filterArr.filter(x => x == "Cezalı").length || 0
        let ban = filterArr.filter(x => x == "Yasaklı").length || 0
        let warn = filterArr.filter(x => x == "Uyarı").length || 0
        let puan = await this.client.punishPoint(member.id)


  if (
    puan >= Limit.Point_Limit &&
    !message.member.roles.cache.some(role => message.guild.roles.cache.get(Permissions.Ust_Yetkili).rawPosition <= role.rawPosition)
  ) {
    const embed = new MessageEmbed()
.setAuthor(member.user.tag, member.user.avatarURL({ dynamic: true }))
.setColor("RANDOM")
.setDescription(`
🚫 ${member.toString()} kişisinin toplam `+puan+` ceza puanı 
olduğu için kayıt işlemi iptal edildi. Sunucumuzda tüm 
işlemlerin kayıt altına alındığını unutmayın. Sorun Teşkil eden, 
sunucunun huzurunu bozan ve kurallara uymayan kullanıcılar 
sunucumuza kayıt olamazlar. 
Belirtilen üye toplamda ${ban} adet ban, ${jail} adet cezalı,
${chatMute} adet chat-mute, ${voiceMute} adet voice-mute, ${warn} adet uyarı almış.
       
Eğer konu hakkında bir şikayetiniz var ise <@&${Permissions.Ust_Yetkili}>
rolü ve üstlerine ulaşabilirsiniz.
`)
    return message.channel.send(embed)
  }


  const newnick = `${member.user.username.includes(Guild.Tag) ? Guild.Tag : (Guild.Secondary_Tag ? Guild.Secondary_Tag : (Guild.Secondary_Tag || ""))} ${nick} | ${age}`;
  await member.setNickname(newnick);

  const nickData = {
    nick: newnick,
    type: "İsim Değiştirme"
  };

  let registerModel = await Register.findOne({
    guildId: message.guild.id, 
    userId: member.user.id
  });
  if (!registerModel) registerModel = await Register.create({
      guildId: message.guild.id,
      userId: member.user.id,
      totalRegister: 0,
      womanRegister: 0,
      manRegister: 0,
      userNames: []
    });

const embed = new MessageEmbed()
.setAuthor(message.author.tag, message.author.avatarURL({ dynamic: true }))
.setColor("RANDOM")
.setFooter(`Üyenin ceza puanı `+puan+``)
.setDescription(`
${registerModel?.userNames?.length ? `
${member.toString()} üyesinin ismi başarıyla "${nick} | ${age}" ismine değiştirildi. Bu üye daha önce şu isimlerle kayıt olmuş:\n
${this.client.no} Kişinin Toplamda ${registerModel?.userNames?.length ?? 0} isim kayıtı bulundu.
${registerModel?.userNames?.map(x => `\`• ${x.nick}\` (${x.type.replace(`Erkek`, `<@&${Role.Register.Man[0]}>`).replace(`Kız`, `<@&${Role.Register.Woman[0]}>`)})`).slice(0, 10).join("\n ")}\n
Kişinin önceki isimlerine \`!isimler @üye\` komutuyla bakarak kayıt işlemini gerçekleştirmeniz önerilir.` 
: `
${member.toString()} üyesinin ismi başarıyla "${nick} | ${age}" ismine değiştirildi.`}
`);

  await message.channel.send(embed);

  const onay = await message.channel.awaitMessages((m) => m.author.id == message.author.id && ["e", "k", "iptal"].some(cevap => m.content.toLowerCase().includes(cevap)), {max: 1, time: 1000 * 30 });
  if (onay.size < 1) {
    await Register.updateOne({
      guildId: message.guild.id, 
      userId: member.user.id
    }, {
      userNames: [ ...registerModel.userNames, nickData ]
    });
    this.client.channels.cache.get(Log.Zade.Nick).send(new MessageEmbed() .setFooter(`Üyenin ceza puanı `+puan+``+ ` - ` + moment(Date.now()).format("LLL")+"")
    .setAuthor(message.author.tag, message.author.avatarURL({ dynamic: true })).setColor("RANDOM").setDescription(`
    **İsmi Değiştirilen Üye:** ${member.toString()} - ${member.id}
    **İsim Değiştiren Yetkili:** ${message.author} - ${message.author.id}
    **Yeni İsim:** ${newnick}
    `))
    return message.channel.send(embed.setDescription(`${member.toString()} adlı üyenin kaydı herhangi bir işlem yapılmadığından dolayı iptal edildi. Databaseye -İsim Değiştirme- olarak veri yollandı.`)).then(x => x.delete({timeout: 5000}));

  }

  
  let kullanici = args.length > 0 ? message.mentions.users.first() || await this.client.client_üye(args[0]) || message.author : message.author
  let uye = message.guild.member(kullanici);
  const onayContent = onay.first().content.toLowerCase();

  if (onayContent.includes(".e")) {
    let staffData = await Register.findOne({ guildId: message.guild.id, userId: message.author.id });
    if (!staffData) staffData = new Register({
      guildId: message.guild.id,
      userId: message.author.id,
      totalRegister: 1,
      womanRegister: 0,
      manRegister: 1,
      userNames: []
    });
    staffData.totalRegister++
    staffData.manRegister++
    await staffData.save();
    nickData.type = "Erkek";
    await Register.updateOne({
      guildId: message.guild.id, 
      userId: member.user.id
    }, {
      userNames: [ ...registerModel.userNames, nickData ]
    });

 
    if (Limit.Tagli_Alim && (!member.user.username.includes(Guild.Tag) && !member.premiumSince && !member.roles.cache.has(GuildRole.Vip))) return message.channel.send("Bu üye taglı olmadığı için kayıt edemezsiniz!");

    let roles = member.roles.cache.clone().filter(e => e.managed).map(e => e.id).concat(Role.Register.Man);
    if(member.user.username.includes(Guild.Tag)) roles.push(Role.Family_Role)
    member.roles.set(roles).catch();
   
    const embed = new MessageEmbed()
      .setAuthor(message.author.tag, message.author.avatarURL({ dynamic: true }))
      .setColor("RANDOM")
      .setDescription(`${member.toString()} üyesine ${Role.Register.Man.map(x => `<@&${x}>`)} rolleri verildi.`)
      .setFooter(`Üyenin ceza puanı `+puan+``);
    message.channel.send(embed)//.then(x => x.delete({timeout: 5000}))
    this.client.channels.cache.get(Log.General_Chat).send(`Aramıza yeni biri katıldı! ${member.toString()} ona hoş geldin diyelim!`)
 
    this.client.channels.cache.get(Log.Register.Log).send(new MessageEmbed()
    .setColor("RANDOM")
    .setFooter(`Üyenin ceza puanı `+puan+``+ ` - ` + moment(Date.now()).format("LLL")+"")
    .setAuthor(message.author.tag, message.author.avatarURL({ dynamic: true }))
    .setDescription(`
    Üye: ${member.toString()} - **${member.id}**
    Yetkili: ${message.author} - **${message.author.id}**
    İsim: "${newnick}"
    Cinsiyet: Erkek
     `))
  }

  if (onayContent.includes(".k")) {
    let staffData = await Register.findOne({ guildId: message.guild.id, userId: message.author.id });
    if (!staffData) staffData = new Register({
      guildId: message.guild.id,
      userId: message.author.id,
      totalRegister: 1,
      womanRegister: 0,
      manRegister: 1,
      userNames: []
    });
    staffData.totalRegister++
    staffData.womanRegister++
    await staffData.save();
    nickData.type = "Kız";
    await Register.updateOne({
      guildId: message.guild.id, 
      userId: member.user.id
    }, {
      userNames: [ ...registerModel.userNames, nickData ]
    });
 
    if (Limit.Tagli_Alim && (!member.user.username.includes(Guild.Tag) && !member.premiumSince && !member.roles.cache.has(GuildRole.Vip))) return message.channel.send("Bu üye taglı olmadığı için kayıt edemezsiniz!");

    let roles = member.roles.cache.clone().filter(e => e.managed).map(e => e.id).concat(Role.Register.Woman);
    if(member.user.username.includes(Guild.Tag)) roles.push(Role.Family_Role)
    member.roles.set(roles).catch();

    const embed = new MessageEmbed()
      .setAuthor(message.author.tag, message.author.avatarURL({ dynamic: true }))
      .setColor("RANDOM")
      .setDescription(`${member.toString()} üyesine ${Role.Register.Woman.map(x => `<@&${x}>`)} rolleri verildi.`)
      .setFooter(`Üyenin ceza puanı `+puan+``);
    message.channel.send(embed)//.then(x => x.delete({timeout: 5000}))
    this.client.channels.cache.get(Log.General_Chat).send(`Aramıza yeni biri katıldı! ${member.toString()} ona hoş geldin diyelim!`)
  
    this.client.channels.cache.get(Log.Register.Log).send(new MessageEmbed()
    .setColor("RANDOM")
    .setFooter(`Üyenin ceza puanı `+puan+``+ ` - ` + moment(Date.now()).format("LLL")+"")
    .setAuthor(message.author.tag, message.author.avatarURL({ dynamic: true }))
    .setDescription(`
    Üye: ${member.toString()} - **${member.id}**
    Yetkili: ${message.author} - **${message.author.id}**
    İsim: "${newnick}"
    Cinsiyet: Kadın
     `))
  }

  if (onayContent.includes(".iptal")) {
    const embed = new MessageEmbed()
      .setAuthor(message.author.tag, message.author.avatarURL({ dynamic: true }))
      .setColor("RANDOM")
      .setDescription(`${member.toString()} adlı kullanıcının kayıt işlemi iptal edildi.`);
    await Register.updateOne({
      guildId: message.guild.id, 
      userId: member.user.id
    }, {
      userNames: [ ...registerModel.userNames, nickData ]
    });
    message.channel.send(embed);
  }

})
  }
}


module.exports = İsim;