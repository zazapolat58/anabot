const Register = require("../models/kayıt.js")
const Role = require("../Settings/Role.json")
const mongoose = require("mongoose");
module.exports = class {
    constructor(client) {
        this.client = client;
    }

    async run(member) {
      if (member.roles.cache.has(Role.Register.Unregistered)) return
      if (member.roles.cache.has(Role.Jail.Role)) return
      if (member.roles.cache.has(Role.Yasaklı_Tag.Role)) return
        let nameData = await Register.findOne({ guildId: member.guild.id, userId: member.id});

    if(!nameData) {
      let newNameData = new Register({
        _id: new mongoose.Types.ObjectId(),
        guildId: member.guild.id,
        userId: member.id,
        registerSize: 0,
        userNames: [{ nick: member.displayName, type: `Sunucudan Ayrılma`}]
      }).save();
    } else {
       nameData.userNames.push({ nick: member.displayName, type: `Sunucudan Ayrılma`})
       nameData.save();
        }
    }
};
