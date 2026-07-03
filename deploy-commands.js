require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const config = require('./config.json');

// تعريف أمر السلاش
const commands = [
    new SlashCommandBuilder()
        .setName('panel')
        .setDescription('فتح لوحة التحكم الإدارية لبث الرسائل والأنظمة')
].map(command => command.toJSON());

const token = process.env.TOKEN || config.TOKEN;

if (!token) {
    console.error("❌ خطأ: لم يتم العثور على توكن البوت في الملفات!");
    process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        console.log('🔄 جاري تسجيل أمر السلاش (/panel) لجميع السيرفرات...');
        
        // استخدام آيدي البوت الخاص بك لتسجيل الأمر عالمياً (Global Command)
        await rest.put(
            Routes.applicationCommands('1504088907283959911'), 
            { body: commands }
        );
        
        console.log('✅ تم تسجيل أمر السلاش بنجاح! سيظهر في كل السيرفرات خلال دقائق.');
    } catch (error) {
        console.error('❌ حدث خطأ أثناء التسجيل:', error);
    }
})();
