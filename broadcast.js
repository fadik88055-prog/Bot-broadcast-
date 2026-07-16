const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('broadcast')
        .setDescription('نظام برودكاست Malaysia الاحترافي')
        .addStringOption(option => option.setName('message').setDescription('الرسالة المراد إرسالها').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const msg = interaction.options.getString('message');
        const members = await interaction.guild.members.fetch();
        const activeMembers = members.filter(m => !m.user.bot);
        
        await interaction.reply({ content: `🚀 جاري بدء عملية البرودكاست لـ ${activeMembers.size} عضو...`, ephemeral: true });

        let sent = 0;
        let errors = 0;

        const embed = new EmbedBuilder()
            .setTitle('📢 Malaysia Brod&ticket - Status')
            .setDescription(`جاري الإرسال: 0/${activeMembers.size}`)
            .setColor('Blue');

        const statusMsg = await interaction.channel.send({ embeds: [embed] });

        for (const [id, member] of activeMembers) {
            try {
                await member.send(msg).catch(() => { errors++; });
                sent++;
                
                // تحديث الـ Embed كل 5 رسائل لتجنب ضغط الـ Rate Limit
                if (sent % 5 === 0) {
                    embed.setDescription(`جاري الإرسال: ${sent}/${activeMembers.size}\nفشل: ${errors}`);
                    await statusMsg.edit({ embeds: [embed] });
                }
                
                // تأخير عشوائي آمن (بين 15-20 ثانية) - **هذا هو سر الاحترافية**
                await new Promise(r => setTimeout(r, 15000 + Math.random() * 5000));
            } catch (e) { errors++; }
        }

        embed.setTitle('✅ اكتملت العملية').setDescription(`تم الإرسال بنجاح لـ ${sent} عضو.\nفشل: ${errors}`);
        await statusMsg.edit({ embeds: [embed] });
    }
};

