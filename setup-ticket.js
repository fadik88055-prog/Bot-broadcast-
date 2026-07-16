const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-ticket')
        .setDescription('⚙️ إعداد نظام تذاكر Malaysia Brod&ticket المتطور')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🎫 Malaysia Brod&ticket | مركز الدعم الفني')
            .setDescription('أهلاً بك في نظام التذاكر المطور.\nالرجاء اختيار القسم المناسب من القائمة بالأسفل لفتح تذكرة وسيتم التعامل مع طلبك على الفور.')
            .setColor('#1abc9c')
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .setFooter({ text: 'Malaysia Brod&ticket - نظام تذاكر احترافي', iconURL: interaction.client.user.displayAvatarURL() });

        const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('ticket_select')
                .setPlaceholder('🎯 اضغط هنا واختبر قسم التذكرة...')
                .addOptions([
                    { 
                        label: 'الدعم الفني والبرمجة', 
                        value: 'support', 
                        emoji: '🛠️', 
                        description: 'للمشاكل البرمجية والمساعدة التقنية العامة' 
                    },
                    { 
                        label: 'الإدارة العامة والمبيعات', 
                        value: 'admin', 
                        emoji: '👮', 
                        description: 'للاستفسارات الخاصة والشكاوى وشراء الرتب' 
                    }
                ])
        );

        await interaction.reply({ content: '✅ تم إرسال لوحة التذاكر بنجاح!', ephemeral: true });
        await interaction.channel.send({ embeds: [embed], components: [row] });
    }
};

