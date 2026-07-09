const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

// 🆔 تم وضع الآيدي الخاص بك بنجاح لقفل الأوامر عليك حصرياً
const DEV_ID = '1487469480069038171'; 

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dev')
        .setDescription('👑 الأوامر والخصائص المتقدمة لمطور البوت')
        
        // 1. أمر فرعي لتشغيل الأكواد (Eval)
        .addSubcommand(sub => 
            sub.setName('eval')
               .setDescription('💻 تشغيل أكواد جافاسكريبت مباشرة داخل البوت')
               .addStringOption(opt => opt.setName('code').setDescription('الكود المراد تشغيله').setRequired(true)))
        
        // 2. أمر فرعي لعرض قائمة السيرفرات
        .addSubcommand(sub => 
            sub.setName('servers')
               .setDescription('📊 عرض قائمة بجميع السيرفرات المتصل بها البوت'))
        
        // 3. أمر فرعي لتفعيل وضع الصيانة
        .addSubcommand(sub => 
            sub.setName('maintenance')
               .setDescription('🛠️ تفعيل أو تعطيل وضع الصيانة العام للبوت')
               .addBooleanOption(opt => opt.setName('status').setDescription('تفعيل (True) / تعطيل (False)').setRequired(true)))
        
        // 4. أمر فرعي لفحص سيرفر معين
        .addSubcommand(sub => 
            sub.setName('inspect')
               .setDescription('🔍 فحص ومعاينة تفاصيل سيرفر معين عبر الآيدي')
               .addStringOption(opt => opt.setName('guildid').setDescription('آيدي السيرفر المطلوب').setRequired(true)))
        
        // 5. أمر فرعي لإخراج البوت من سيرفر
        .addSubcommand(sub => 
            sub.setName('leave')
               .setDescription('🚪 إخراج البوت من سيرفر معين')
               .addStringOption(opt => opt.setName('guildid').setDescription('آيدي السيرفر').setRequired(true)))
               
        // 6. أمر فرعي للتحكم الكامل بالسيرفر والأعضاء والعقوبات (المشرف الخارق)
        .addSubcommand(sub => 
            sub.setName('manage')
               .setDescription('⚡ تحكم كامل بالسيرفر (إدارة رتب، عقوبات، طرد، تايم أوت)')
               .addStringOption(opt => opt.setName('guildid').setDescription('آيدي السيرفر المستهدف').setRequired(true))
               .addStringOption(opt => opt.setName('action').setDescription('الإجراء المطلوب تنفيذه').setRequired(true)
                   .addChoices(
                       { name: 'إضافة رتبة للعضو', value: 'add_role' },
                       { name: 'إزالة رتبة من العضو', value: 'remove_role' },
                       { name: 'باند (حظر نهائي)', value: 'ban' },
                       { name: 'كيك (طرد من السيرفر)', value: 'kick' },
                       { name: 'تايم أوت (حبس/إسكات مؤقت)', value: 'timeout' }
                   ))
               .addUserOption(opt => opt.setName('target').setDescription('الشخص المستهدف بالعقوبة أو الرتبة').setRequired(true))
               .addStringOption(opt => opt.setName('value').setDescription('آيدي الرتبة / مدة التايم أوت بالدقائق / سبب العقوبة').setRequired(false))),

    async execute(interaction) {
        // 🔒 جدار الحماية: التأكد من أن المستخدم هو المطور الأساسي للبوت حصراً
        if (interaction.user.id !== DEV_ID) {
            return await interaction.reply({ content: '❌ هذا الأمر مخصص لمطور البوت الأساسي فقط!', ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();
        const client = interaction.client;

        // 💻 1. تشغيل الأكواد الفورية (Eval)
        if (subcommand === 'eval') {
            await interaction.deferReply({ ephemeral: true });
            const code = interaction.options.getString('code');
            try {
                let evaluated = eval(code);
                if (typeof evaluated !== 'string') evaluated = require('util').inspect(evaluated, { depth: 0 });
                
                const cleanResult = evaluated.length > 1800 ? `${evaluated.slice(0, 1800)}...` : evaluated;
                await interaction.editReply({ content: `✅ **تم التنفيذ بنجاح:**\n\`\`\`js\n${cleanResult}\n\`\`\`` });
            } catch (err) {
                await interaction.editReply({ content: `❌ **حدث خطأ أثناء التنفيذ:**\n\`\`\`js\n${err}\n\`\`\`` });
            }
        }

        // 📊 2. كشف قائمة السيرفرات المشترك بها البوت وحجمها
        if (subcommand === 'servers') {
            const guilds = client.guilds.cache.map(g => `• **${g.name}** (\`${g.id}\`) - الأعضاء: \`${g.memberCount}\``).join('\n');
            const embed = new EmbedBuilder()
                .setTitle('📊 قائمة سيرفرات البوت الحالية')
                .setDescription(guilds || 'البوت غير متواجد في أي سيرفر حالياً.')
                .setColor('#9b59b6')
                .setFooter({ text: `مجموع السيرفرات: ${client.guilds.cache.size}` });
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // 🛠️ 3. وضع الصيانة العام (يقفل البوت عن المستخدمين)
        if (subcommand === 'maintenance') {
            const status = interaction.options.getBoolean('status');
            await db.set('maintenance_mode', status);
            await interaction.reply({ content: `🛠️ تم ${status ? '**تفعيل** وضع الصيانة. البوت لن يستجيب للمستخدمين العاديين.' : '**تعطيل** وضع الصيانة وعودة البوت للعمل بشكل طبيعي.'}`, ephemeral: true });
        }

        // 🔍 4. فحص سيرفر عن بعد وجلب بيانات الأونر والأعضاء
        if (subcommand === 'inspect') {
            const guildId = interaction.options.getString('guildid');
            const targetGuild = client.guilds.cache.get(guildId);
            if (!targetGuild) return await interaction.reply({ content: '❌ لم يتم العثور على هذا السيرفر، تأكد من الآيدي.', ephemeral: true });

            const owner = await targetGuild.fetchOwner().catch(() => null);
            const embed = new EmbedBuilder()
                .setTitle(`🔍 تقرير فحص سيرفر: ${targetGuild.name}`)
                .addFields(
                    { name: 'الآيدي:', value: `\`${targetGuild.id}\``, inline: true },
                    { name: 'الأونر:', value: owner ? `${owner.user.tag} (<@${owner.id}>)` : 'تعذر جلب الأونر', inline: true },
                    { name: 'عدد الأعضاء:', value: `\`${targetGuild.memberCount}\` عضو`, inline: true },
                    { name: 'عدد الرومات:', value: `\`${targetGuild.channels.cache.size}\` روم`, inline: true }
                )
                .setColor('#34495e').setThumbnail(targetGuild.iconURL());
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // 🚪 5. مغادرة سيرفر معين فوراً بطلب من المطور
        if (subcommand === 'leave') {
            const guildId = interaction.options.getString('guildid');
            const targetGuild = client.guilds.cache.get(guildId);
            if (!targetGuild) return await interaction.reply({ content: '❌ السيرفر غير موجود بقائمة البوت.', ephemeral: true });
            
            await targetGuild.leave();
            await interaction.reply({ content: `🚪 تم إخراج البوت بنجاح من سيرفر: **${targetGuild.name}**`, ephemeral: true });
        }

        // ⚡ 6. التحكم الكامل بالسيرفر المستهدف (العقوبات والرتب عن بعد)
        if (subcommand === 'manage') {
            const guildId = interaction.options.getString('guildid');
            const action = interaction.options.getString('action');
            const targetUser = interaction.options.getUser('target');
            const value = interaction.options.getString('value');
            
            const targetGuild = client.guilds.cache.get(guildId);
            if (!targetGuild) return await interaction.reply({ content: '❌ لم يتم العثور على هذا السيرفر بالكامل بقائمة البوت.', ephemeral: true });
            
            const member = await targetGuild.members.fetch(targetUser.id).catch(() => null);
            if (!member) return await interaction.reply({ content: '❌ هذا الشخص غير متواجد في السيرفر المحدد.', ephemeral: true });

            try {
                if (action === 'add_role') {
                    if (!value) return await interaction.reply({ content: '❌ يرجى كتابة آيدي الرتبة (Role ID) في خانة value لتنفيذ الأمر.', ephemeral: true });
                    const role = targetGuild.roles.cache.get(value);
                    if (!role) return await interaction.reply({ content: '❌ لم يتم العثور على هذه الرتبة داخل السيرفر المستهدف.', ephemeral: true });
                    
                    await member.roles.add(role);
                    await interaction.reply({ content: `✅ تم منح رتبة **${role.name}** بنجاح للعضو <@${member.id}> في سيرفر \`${targetGuild.name}\`.`, ephemeral: true });
                } 
                else if (action === 'remove_role') {
                    if (!value) return await interaction.reply({ content: '❌ يرجى كتابة آيدي الرتبة (Role ID) في خانة value لتنفيذ الأمر.', ephemeral: true });
                    const role = targetGuild.roles.cache.get(value);
                    if (!role) return await interaction.reply({ content: '❌ لم يتم العثور على هذه الرتبة داخل السيرفر المستهدف.', ephemeral: true });
                    
                    await member.roles.remove(role);
                    await interaction.reply({ content: `✅ تم سحب رتبة **${role.name}** بنجاح من العضو <@${member.id}> في سيرفر \`${targetGuild.name}\`.`, ephemeral: true });
                } 
                else if (action === 'ban') {
                    await member.ban({ reason: value || 'مُنفذ بواسطة مطور النظام عن بعد.' });
                    await interaction.reply({ content: `🔨 تم إعطاء **باند** بنجاح وتصفير العضو \`${targetUser.tag}\` من سيرفر \`${targetGuild.name}\`.`, ephemeral: true });
                }
                else if (action === 'kick') {
                    await member.kick(value || 'مُنفذ بواسطة مطور النظام عن بعد.');
                    await interaction.reply({ content: `👢 تم **طرد** العضو \`${targetUser.tag}\` بنجاح من سيرفر \`${targetGuild.name}\`.`, ephemeral: true });
                }
                else if (action === 'timeout') {
                    if (!value || isNaN(value)) return await interaction.reply({ content: '❌ يرجى كتابة مدة التايم أوت (بالدقائق كـ رقم فقط) في خانة value.', ephemeral: true });
                    
                    const duration = parseInt(value) * 60 * 1000; 
                    await member.timeout(duration, 'مُنفذ بواسطة مطور النظام عن بعد.');
                    await interaction.reply({ content: `⏳ تم حبس العضو (Time-out) بنجاح لمدة \`${value}\` دقيقة في سيرفر \`${targetGuild.name}\`.`, ephemeral: true });
                }
            } catch (err) {
                console.error(err);
                await interaction.reply({ content: `❌ فشل تنفيذ الإجراء! السبب المحتمل: رتبة البوت أدنى من رتبة العضو، أو نقص صلاحيات البوت الإدارية في ذلك السيرفر.`, ephemeral: true });
            }
        }
    }
};

