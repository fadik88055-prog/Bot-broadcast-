require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const config = require('./config.json');

// تعريف أمر السلاش
const commands = [
    new SlashCommandBuilder()
        .setName('panel')
        .setDescription('فتح لوحة التحكم الخاصة بالبوت')
].map(command => command.toJSON());

// استخدام التوكن من ملف البيئة أو ملف الكونفق
const token = process.env.TOKEN || config.TOKEN;

if (!token) {
    console.error("❌ خطأ: لم يتم العثور على توكن البوت!");
    process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        console.log('🔄 جاري تسجيل أمر السلاش لدى ديسكورد...');

        // سحب الـ Bot ID تلقائياً أو يمكنك كتابته مكان client_id
        // Routes.applicationCommands ستقوم بتسجيل الأمر لجميع السيرفرات
        // ملاحظة: قد يستغرق ظهور الأمر لجميع السيرفرات بضع دقائق، أو يظهر فوراً في سيرفرات التجارب.
        await rest.put(
            Routes.applicationCommands(config.ownerID), // يفضل استبدال config.ownerID بـ ID البوت نفسه إذا لم يعمل تلقائياً
            { body: commands }
        );

        console.log('✅ تم تسجيل أمر /panel بنجاح في ديسكورد!');
    } catch (error) {
        console.error('❌ حدث خطأ أثناء تسجيل الأمر:', error);
    }
})();
