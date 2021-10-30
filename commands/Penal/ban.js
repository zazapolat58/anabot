const Command = require("../../base/Command.js");
const Permissions = require("../../Settings/Permissions.json");
const Log = require("../../Settings/Log.json")
const Limit = require("../../Settings/Limit.json");
const moment = require("moment")
require("moment-duration-format")
const cezalar = require("../../models/cezalar.js")
const Discord = require("discord.js")
const data = require("../../models/cezalar.js")
const sunucu = require("../../models/sunucu-bilgi.js")
Date.prototype.timeNow = function() {
    return ((this.getHours() < 10) ? "0" : "") + this.getHours() + ":" + ((this.getMinutes() < 10) ? "0" : "") + this.getMinutes() + ":" + ((this.getSeconds() < 10) ? "0" : "") + this.getSeconds();
}
Date.prototype.today = function() {
    return ((this.getDate() < 10) ? "0" : "") + this.getDate() + "/" + (((this.getMonth() + 1) < 10) ? "0" : "") + (this.getMonth() + 1) + "/" + this.getFullYear();
}
class Ban extends Command {
    constructor(client) {
        super(client, {
            name: "ban",
            aliases: ["ban"]
        });
    }

    async run(message, args, perm) {
       if(!message.member.roles.cache.has(Permissions.Ban.Auth_Roles) && !message.member.hasPermission("VIEW_AUDIT_LOG")) return
        if (args.length < 1) return this.client.yolla("Bir üye etiketle ve tekrardan dene!", message.author, message.channel)
        let user = message.mentions.users.first() || await this.client.users.fetch(args[0]).catch(e => console.log(e))
        if (!user) return this.client.yolla("Belirttiğiniz kullanıcı geçerli değil.", message.author, message.channel)
        if(user.id === message.author.id) return this.client.yolla("Kendi kendini banlayamazsın.", message.author, message.channel)
        if (message.guild.members.cache.has(user.id) && message.guild.members.cache.get(user.id).hasPermission("VIEW_AUDIT_LOG")) return this.client.yolla("Üst yetkiye sahip kişileri yasaklayamazsın!", message.author, message.channel)
        if (message.guild.members.cache.has(user.id) && message.member.roles.highest.position <= message.guild.members.cache.get(user.id).roles.highest.position) return this.client.yolla("Kendi rolünden yüksek kişilere işlem uygulayamazsın!", message.author, message.channel)
        let reason = args.slice(1).join(" ") || "Sebep Belirtilmedi."
        let count = await data.countDocuments().exec();
        //let can = count ? count++ : 1;
        let can = count
        const embed = new Discord.MessageEmbed()
            .setAuthor(message.author.tag, message.author.displayAvatarURL({ dynamic: true }))
            .setColor("RANDOM")
            .setDescription(`**${user.tag}** kullanıcısı **${message.author.tag}** tarafından başarıyla sunucudan yasaklandı. (Ceza Numarası: \`#${can + 1}\`)`).setImage(Permissions.Ban.GIF.length > 0 ? Permissions.Ban.GIF : null);
            await message.channel.send(embed)

            const banlandı = new Discord.MessageEmbed()
            .setAuthor(message.author.tag, message.author.displayAvatarURL({ dynamic: true }))
            .setColor("32CD32")
            .setDescription(`
            ${user ? user.toString() : user.username} üyesi banlandı!

Ceza ID: \`#${can}\`
Banlanan Üye: ${user ? user.toString() : ""} \`(${user.username.replace(/\`/g, "")} - ${user.id})\`
Banlayan Yetkili: ${message.author} \`(${message.author.username.replace(/\`/g, "")} - ${message.author.id})\`
Ban Tarihi: \`${moment(Date.now() + (1000*60*60*3)).format("LLL")}\`
Ban Sebebi: \`${reason}\`
            `)
         
         
            await this.client.channels.cache.get(Log.Ban.Log).send(banlandı)
            await user.send(new Discord.MessageEmbed().setColor("RANDOM").setImage(Permissions.Ban.GIF.length > 0 ? Permissions.Ban.GIF : null).setAuthor(message.author.tag, message.author.displayAvatarURL({ dynamic: true })).setDescription(`
                **${message.guild.name}** sunucusundan ${reason} sebebiyle **${message.author.tag}** tarafından yasaklandın. (Ceza Numaran: \`#${can + 1}\`)
           ` ))
           
            message.guild.fetchBans(true).then(async (bans) => {
            let ban = await bans.find(a => a.user.id === user.id)
            if (ban) return this.client.yolla(`**${user.tag}** kullanıcısı zaten yasaklanmış durumda.`, message.author, message.channel)
            if (!ban) {
                let banNum = this.client.banLimit.get(message.author.id) || 0
                this.client.banLimit.set(message.author.id, banNum + 1)
                if (banNum == Limit.Ban_Limit) return this.client.yolla("Gün içerisinde çok fazla ban işlemi uyguladığınız için komut geçici olarak kullanımınıza kapatılmıştır.", message.author, message.channel)
                await message.guild.members.ban(user.id, { reason: `${reason} | Yetkili: ${message.author.tag}` })
                await data.find({}).sort({ ihlal: "descending" }).exec(async (err, res) => {
                    const newData = new data({
                        user: user.id,
                        yetkili: message.author.id,
                        ihlal: can + 1,
                        ceza: "Yasaklı",
                        sebep: reason,
                        tarih: moment(Date.now() + (1000*60*60*3)).format("LLL"),
                        bitiş: "-"
                    })
                    newData.save().catch(e => console.error(e))
                    this.client.savePunishment()
                })
            }
        })
    }
}

module.exports = Ban;
// https://cdn.discordapp.com/attachments/813361327950659585/817791306779852820/giphy_1.gif
