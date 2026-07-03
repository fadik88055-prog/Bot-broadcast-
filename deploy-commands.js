const { REST, Routes } = require('discord.js');

// الأوامر التي سيتم تسجيلها في ديسكورد
const commands = [
    {
        name: 'panel',
        description: 'يفتح لوحة التحكم الإدارية للبوت (Broadcast Dashboard)',
    }
];

// جلب التوكن من متغيرات البيئة الآمنة في Railway
const token = process.env.TOKEN;

// أيدي البوت الخاص بك (الرقم فقط)
const clientId = '1504088907283959911'; 

if (!token) {
    console.error('⚠️ خطأ: لم يتم العثور على التوكن (TOKEN) في متغيرات Railway!');
    process.exit(1);
}

// تهيئة أداة الـ REST لإرسال الأوامر لديسكورد
const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        console.log('⏳ جاري تسجيل أوامر السلاش (/) في ديسكورد...');

        // إرسال الأوامر عالمياً لتعمل في جميع السيرفرات المتواجد فيها البوت
        await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands },
        );

        console.log('✅ Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error('❌ فشل تسجيل الأوامر، تأكد من الـ Logs:', error);
    }
})();
