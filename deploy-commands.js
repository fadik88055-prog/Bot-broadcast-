require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const config = require('./config.json');

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
        console.log('🔄 جاري تسجيل أمر السلاش (/panel) في ديسكورد...');
        // ملاحظة: استبدل config.ownerID بـ آيدي البوت نفسه (Application ID) إذا لم يظهر الأمر تلقائياً
        await rest.put(
            Routes.applicationCommands(config.ownerID), 
            { body: commands }
        );
        console.log('✅ تم تسجيل أمر السلاش بنجاح!');
    } catch (error) {
        console.error('❌ حدث خطأ أثناء التسجيل:', error);
    }
})();
