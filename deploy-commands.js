const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const config = require('./config.json');

const commands = [
    new SlashCommandBuilder()
        .setName('panel')
        .setDescription('فتح لوحة التحكم الإدارية لبث الرسائل والأنظمة')
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(config.TOKEN);

(async () => {
    try {
        console.log('🔄 جاري تسجيل أمر السلاش (/panel) لجميع السيرفرات عالمياً...');
        
        await rest.put(
            Routes.applicationCommands(config.botID), 
            { body: commands }
        );
        
        console.log('✅ تم تسجيل أمر السلاش بنجاح! سيظهر في كل السيرفرات خلال دقائق.');
    } catch (error) {
        console.error('❌ حدث خطأ أثناء التسجيل:', error);
    }
})();
