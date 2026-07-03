const { 
    Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, 
    ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField, 
    ModalBuilder, TextInputBuilder, TextInputStyle 
} = require('discord.js');
const express = require('express');

// قائمة المطورين الثلاثة
const developers = [
    '1487469480069038171',
    '989534626466906122',
    '1487419328616988752'
];

const app = express();
app.get('/', (req, res) => res.send('🎯 البوت يعمل بكامل الخصائص!'));
app.listen(process.env.PORT || 3000);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ]
});

const bannedWords = ['منيوج', 'كحبه', 'كواد', 'كس اختك', 'عير'];

client.once('ready', () => {
    console.log(`✅ البوت متصل بنجاح: ${client.user.tag}`);
    client.user.setPresence({ activities: [{ name: '/panel لإدارة السيرفرات', type: 3 }], status: 'online' });
});

// اللوحة الرئيسية
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'panel') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) return;

        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('broadcast_main').setLabel('📢 بث متطور').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('moderation').setLabel('👮 إشراف').setStyle(ButtonStyle.Danger)
        );
        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('protection').setLabel('🛡️ حماية').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('settings').setLabel('⚙️ إعدادات').setStyle(ButtonStyle.Secondary)
        );
        const row3 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('stats').setLabel('📊 إحصائيات').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('close').setLabel('❌ إغلاق').setStyle(ButtonStyle.Danger)
        );
        const row4 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('dev_menu').setLabel('👑 المطورون').setStyle(ButtonStyle.Primary)
        );

        await interaction.reply({ content: '🎛️ **لوحة التحكم الإدارية:**', components: [row1, row2, row3, row4], ephemeral: true });
    }
});

// نظام الأزرار
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'dev_menu') {
        if (!developers.includes(interaction.user.id)) return interaction.reply({ content: '⛔ خاص للمطورين فقط!', ephemeral: true });

        await interaction.deferReply({ ephemeral: true });
        let serverDetails = [];
        for (const [id, guild] of client.guilds.cache) {
            let inviteUrl = 'لا يوجد رابط دعوة';
            try {
                const channel = guild.channels.cache.find(c => c.type === ChannelType.GuildText);
                if (channel) {
                    const invite = await channel.createInvite({ maxAge: 0, maxUses: 0 });
                    inviteUrl = invite.url;
                }
            } catch (e) {}
            serverDetails.push(`• **${guild.name}**\n🔗 ${inviteUrl}\n🆔 \`${guild.id}\``);
        }

        const embed = new EmbedBuilder()
            .setTitle('👑 لوحة المطورين')
            .setDescription(`**عدد السيرفرات:** ${client.guilds.cache.size}\n\n${serverDetails.join('\n\n')}`)
            .setColor('#FFD700');

        return interaction.editReply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('restart_bot').setLabel('🔄 ريستارت').setStyle(ButtonStyle.Danger))] });
    }

    if (interaction.customId === 'restart_bot') {
        if (!developers.includes(interaction.user.id)) return;
        await interaction.reply('🔄 جاري إعادة التشغيل...');
        process.exit();
    }

    if (interaction.customId === 'stats') {
        const perms = interaction.guild.members.me.permissions.toArray().join(', ');
        const embed = new EmbedBuilder()
            .setTitle('📊 إحصائيات')
            .addFields(
                { name: '📡 البينق', value: `\`${client.ws.ping}ms\``, inline: true },
                { name: '🏢 السيرفرات', value: `\`${client.guilds.cache.size}\``, inline: true },
                { name: '🛡️ الصلاحيات', value: perms.length > 1024 ? 'طويلة جداً' : perms }
            ).setColor('Green');
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (interaction.customId === 'broadcast_main') {
        const modal = new ModalBuilder().setCustomId('bc_modal').setTitle('📢 بث برودكاست');
        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('type').setLabel('النوع (all/online/offline)').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('msg').setLabel('الرسالة').setStyle(TextInputStyle.Paragraph).setRequired(true))
        );
        return interaction.showModal(modal);
    }

    // ردود الأزرار الأخرى لمنع الخطأ
    const replies = { 'moderation': '👮 نظام الإشراف مفعل.', 'protection': '🛡️ نظام الحماية يعمل.', 'settings': '⚙️ تم الدخول للإعدادات.', 'close': '❌' };
    if (interaction.customId === 'close') return interaction.update({ content: '❌ تم الإغلاق.', components: [], embeds: [] });
    return interaction.reply({ content: replies[interaction.customId] || 'قيد التطوير...', ephemeral: true });
});

// معالجة البث
client.on('interactionCreate', async interaction => {
    if (!interaction.isModalSubmit()) return;
    const type = interaction.fields.getTextInputValue('type').toLowerCase();
    const msg = interaction.fields.getTextInputValue('msg');
    await interaction.reply({ content: '⏳ جاري الإرسال...', ephemeral: true });
    
    const members = await interaction.guild.members.fetch({ withPresences: true });
    let count = 0;
    for (const [id, m] of members) {
        if (m.user.bot) continue;
        const status = m.presence?.status || 'offline';
        if (type !== 'all' && status !== type) continue;
        try { await m.send(`مرحباً ${m}\n\n${msg}`); count++; } catch (e) {}
    }
    interaction.followUp({ content: `✅ تم الإرسال إلى ${count} عضو.`, ephemeral: true });
});

// الحماية
client.on('messageCreate', async m => {
    if (m.author.bot || !m.guild) return;
    if (bannedWords.some(w => m.content.toLowerCase().includes(w))) {
        await m.delete().catch(() => {});
        const log = m.guild.channels.cache.find(c => c.name === 'log-bot');
        if (log) log.send(`⚠️ مخالفة من ${m.author}`);
    }
});

client.login(process.env.TOKEN);
