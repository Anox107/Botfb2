module.exports.config = {
    name: "autosetnameall",
    version: "1.0.1",
    hasPermssion: 1,
    credits: "𝐏𝐫𝐢𝐲𝐚𝐧𝐬𝐡 𝐑𝐚𝐣𝐩𝐮𝐭",
    description: "Automatic setname for new members",
    commandCategory: "Box Chat",
    usages: "[add <name> /remove /apply]",
    cooldowns: 5
}

module.exports.onLoad = () => {
    const { existsSync, writeFileSync } = global.nodemodule["fs-extra"];
    const { join } = global.nodemodule["path"];
    const pathData = join(__dirname, "cache", "autosetname.json");
    if (!existsSync(pathData)) return writeFileSync(pathData, "[]", "utf-8"); 
}

module.exports.run = async function  ({ event, api, args, permssionm, Users })  {
    const { threadID, messageID } = event;
    const { readFileSync, writeFileSync } = global.nodemodule["fs-extra"];
    const { join } = global.nodemodule["path"];

    const pathData = join(__dirname, "cache", "autosetname.json");
    const content = (args.slice(1, args.length)).join(" ");
    var dataJson = JSON.parse(readFileSync(pathData, "utf-8"));
    var thisThread = dataJson.find(item => item.threadID == threadID) || { threadID, nameUser: [] };

    switch (args[0]) {
        case "add": {
            if (content.length == 0) return api.sendMessage("The configuration of the new member's name must not be vacated!", threadID, messageID);
            if (thisThread.nameUser.length > 0) return api.sendMessage("Please remove the old name configuration before naming a new name!!!", threadID, messageID); 
            thisThread.nameUser.push(content);
            const name = (await Users.getData(event.senderID)).name;
            writeFileSync(pathData, JSON.stringify(dataJson, null, 4), "utf-8");
            api.sendMessage(`Configure a successful new member name\nPreview: ${content} ${name}`, threadID, messageID);
            break;
        }

        case "rm":
        case "remove":
        case "delete": {
            if (thisThread.nameUser.length == 0) return api.sendMessage("Your group hasn't configured a new member's name!!", threadID, messageID);
            thisThread.nameUser = [];
            api.sendMessage(`Successfully deleted the configuration of a new member's name`, threadID, messageID);
            break;
        }

        case "apply": {
            if (thisThread.nameUser.length == 0) 
                return api.sendMessage("Your group hasn't configured a new member's name!!", threadID, messageID);

            const threadInfo = await api.getThreadInfo(threadID);
            const members = threadInfo.participantIDs;
            let success = 0, fail = 0;

            for (let userID of members) {
                if (userID == api.getCurrentUserID()) continue; // बॉट खुद को स्किप करे
                try {
                    const userInfo = await Users.getData(userID);
                    const name = userInfo.name;
                    const newName = `${thisThread.nameUser[0]} ${name}`;
                    await api.changeNickname(newName, threadID, userID);
                    success++;
                } catch (e) {
                    console.log(`❌ ${userID} का नाम नहीं बदल पाया:`, e.message);
                    fail++;
                }
            }

            return api.sendMessage(`✅ नाम बदले गए: ${success}\n❌ असफल रहे: ${fail}`, threadID, messageID);
        }

        default: {
            api.sendMessage(`Use:\nautosetname add <name> - Set nickname prefix for new members\nautosetname remove - Remove nickname configuration\nautosetname apply - Apply nickname to all current members`, threadID, messageID);
        }
    }

    if (!dataJson.some(item => item.threadID == threadID)) dataJson.push(thisThread);
    return writeFileSync(pathData, JSON.stringify(dataJson, null, 4), "utf-8");
}
