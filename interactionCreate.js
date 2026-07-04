// استبدل قسم معالجة الأزرار (Buttons) بهذا الكود المحدث والمحمي:
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    try {
        // 🚀 خطوة ذكية: إخبار ديسكورد فوراً بأننا نعمل على الطلب (تجنب الفشل)
        await interaction.deferUpdate().catch(() => {});

        const isDeveloper = developers.includes(interaction.user.id);
        const isOwner = interaction.user.id === botOwner;

        // دالة مساعدة لتحديث اللوحة بأمان
        const updatePanel = async (embed, components) => {
            return await interaction.editReply({ embeds: [embed], components: components }).catch(err => {
                console.error("خطأ أثناء تحديث اللوحة:", err);
            });
        };

        // ... [هنا تضع منطق الأزرار الخاص بك، ولكن بدلاً من interaction.update استعمل updatePanel] ...
        
        // مثال لتعديل زر العودة للرئيسية:
        if (interaction.customId === 'back_to_main') {
            const embed = new EmbedBuilder()
                .setTitle('🎛️ لوحة التحكم الإدارية المركزية - K3')
                .setDescription(isDeveloper ? '👑 **صلاحيات المطور المطلقة مفعّلة.**' : 'مرحباً بك في نظام الإدارة الشامل.')
                .setColor(isDeveloper ? '#FFD700' : '#2b2d31');
            return await updatePanel(embed, getMainPanelComponents());
        }

        // كرر نفس النمط مع باقي الأزرار (استبدل .update بـ .editReply واستعمل deferUpdate في البداية)

    } catch (err) {
        console.error("خطأ غير متوقع في معالجة الزر:", err);
    }
});
