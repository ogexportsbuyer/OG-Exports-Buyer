import type { LegalDocument } from './legal-content.ts';
import type { AdditionalLocale } from './locale-translations-extra.ts';

type PendingLegalDraft = LegalDocument & { reviewStatus: 'pending' };

export const additionalLegalDraftTranslations: Readonly<Record<string, Readonly<Partial<Record<AdditionalLocale, PendingLegalDraft>>>>> = {
  "terms": {
    "ru": {
      "title": "Условия обслуживания",
      "summary": "OG Exports (Private) Limited · Вступает в силу с момента публикации. Данные условия регулируют доступ к веб-сайту OG Exports, приложению для инвесторов и сопутствующим цифровым сервисам.",
      "sections": [
        {
          "bullets": [],
          "heading": "1. Об этих Условиях",
          "paragraphs": [
            "«OG Exports», «мы», «наш» и «нас» относятся к OG Exports (Private) Limited, бизнесу по экспорту и торговле сельскохозяйственной продукцией, базирующемуся в Пакистане. Настоящие Условия регулируют использование вами нашего веб-сайта, приложения для инвесторов, функций учетной записи, каналов поддержки и связанных услуг («Платформа»). Продажи продуктов, экспортные заказы и инвестиции также могут регулироваться отдельными письменными соглашениями.",
            "Если вы не согласны с настоящими Условиями, не создавайте и не продолжайте использовать учетную запись. Императивные права согласно применимому праву не отменяются настоящими Условиями."
          ]
        },
        {
          "bullets": [],
          "heading": "2. Право на участие и учетные записи",
          "paragraphs": [
            "Вы должны быть юридически способны заключить обязывающее соглашение в вашей юрисдикции. Предоставляйте точную, актуальную информацию и обновляйте её при изменениях. Не создавайте учетную запись для другого лица без полномочий.",
            "Вы несете ответственность за защиту своих учетных данных, устройств и кодов верификации, а также за действия, совершенные через вашу учетную запись. Немедленно уведомляйте службу поддержки, если подозреваете несанкционированный доступ. Мы можем запросить документы, удостоверяющие личность или деловые документы, для выполнения требований верификации, безопасности или юридических требований."
          ]
        },
        {
          "bullets": [],
          "heading": "3. Услуги платформы и информация о статусе",
          "paragraphs": [
            "Платформа может отображать торговые возможности, документы по проекту, записи об инвестициях, балансы кошельков, историю транзакций, платежные инструкции, этапы отгрузки, сообщения поддержки и элементы управления учетной записью. Доступность зависит от соответствующей услуги и информации, предоставленной OG Exports (Private) Limited.",
            "Статусы проектов, финансирования, оплат, депозитов, выводов и отгрузок являются информационными до момента их подтверждения соответствующей записью в системе или письменным соглашением. Одобрение — это не то же самое, что завершение, планируемая выплата — это не распределение, а обновление отгрузки — это не отслеживание перевозчика в реальном времени, если это явно не указано.",
            "Информация, балансы, оценки и уведомления, отображаемые Платформой, сами по себе не вносят изменения в подписанное соглашение и не гарантируют, что транзакция завершена."
          ]
        },
        {
          "bullets": [],
          "heading": "4. Право на инвестирование и соглашения",
          "paragraphs": [
            "Доступ к инвестированию зависит от того, открыта ли возможность, соответствует ли ваша учетная запись заявленным проверкам права на участие, и подтвержден ли ваш статус верификации личности, как того требует процесс инвестирования. Приложение не рассматривает KYC как автоматическое условие для депозитов или выводов средств; по-прежнему могут применяться отдельные юридические, охранные или транзакционные проверки.",
            "Каждая возможность имеет свои собственные коммерческие детали и может требовать отдельного подписанного Инвестиционного соглашения. Это соглашение и условия, специфичные для предложения, регулируют сумму инвестиций, торговлю, стороны, валюту, метод расчета, расчеты и другие обязательства, специфичные для проекта. Настоящие Условия Платформы не обещают, что любая возможность будет доступна или принята."
          ]
        },
        {
          "bullets": [],
          "heading": "5. Платежи, кошелек и выводы средств",
          "paragraphs": [
            "Используйте только платежные инструкции, показанные в аутентифицированном канале OG Exports (Private) Limited или подтвержденные в письменной форме уполномоченным персоналом. Депозит не зачисляется до тех пор, пока соответствующие записи не подтвердят получение и верификацию. Никогда не полагайтесь на измененную банковскую инструкцию, полученную через неавторизованное сообщение.",
            "Валюта кошелька соответствует валюте, записанной для вашего профиля и кошелька. Где авторизована конвертация, применимым курсом и суммой являются те, что записаны для этой транзакции; более поздние рыночные курсы не переписывают исторические записи.",
            "Текущие условия вывода средств — это минимальная банковская выплата, эквивалентная USD 100, фиксированная комиссия USD 2, добавляемая поверх запрошенной выплаты (конвертированная в валюту кошелька с использованием записанного курса запроса, где применимо), и ориентировочный период обработки 2 рабочих дня. Это текущие операционные условия, а не гарантия сроков. Сумма, комиссия, валюта и статус, подтвержденные для вашего запроса, имеют приоритет."
          ]
        },
        {
          "bullets": [
            "Используйте Платформу законно и только для предназначенных для нее бизнес- и инвесторских функций.",
            "Не выдавайте себя за другое лицо, не предоставляйте ложные документы, не манипулируйте записями транзакций, не вмешивайтесь в средства контроля безопасности, не сканируйте и не нарушайте работу систем, не собирайте данные ограниченного доступа и не загружайте незаконный или вредоносный контент.",
            "Не используйте Платформу для обхода санкций, контроля мошенничества, экспортных ограничений, платежных правил или других применимых требований."
          ],
          "heading": "6. Допустимое использование",
          "paragraphs": []
        },
        {
          "bullets": [],
          "heading": "7. Контент и интеллектуальная собственность",
          "paragraphs": [
            "Платформа, ее программное обеспечение, дизайн, текст, знаки и материалы принадлежат OG Exports (Private) Limited или ее лицензиарам. Вы можете использовать их только по мере необходимости для доступа к услугам. Вы сохраняете права на документы, которые вы предоставляете, позволяя нам размещать и обрабатывать их для оказания услуги, ведения записей и выполнения юридических обязательств."
          ]
        },
        {
          "bullets": [],
          "heading": "8. Доступность, приостановка и прекращение",
          "paragraphs": [
            "Мы можем обновлять, приостанавливать или ограничивать функцию Платформы по причинам технического обслуживания, безопасности, юридическим, операционным или коммерческим причинам. Мы можем приостановить доступ, когда это обоснованно необходимо для защиты пользователей, расследования подозреваемого неправильного использования или соблюдения закона, и будем прилагать разумные усилия для информирования о существенных действиях в отношении учетной записи, где это разрешено.",
            "Вы можете прекратить использование Платформы и запросить удаление учетной записи через элементы управления данными в приложении или на странице публичного удаления учетной записи. Отправка запроса запускает проверку службой поддержки; это не приводит к немедленному закрытию учетной записи или удалению записей. Инвестиционные, транзакционные, бухгалтерские и комплаенс-записи могут храниться там, где это требуется или оправдано законом или существующим соглашением."
          ]
        },
        {
          "bullets": [],
          "heading": "9. Риск, консультации и отсутствие обещанного результата",
          "paragraphs": [
            "Инвестиции, связанные с торговлей, предполагают возможность задержки, уменьшения доходов или потери части или всего капитала. Доходы не гарантируются. Информация Платформы не является индивидуальной финансовой, юридической, налоговой или инвестиционной консультацией. Прочитайте «Раскрытие рисков» и соответствующее Инвестиционное соглашение и получите независимую консультацию, соответствующую вашим обстоятельствам, перед вложением средств."
          ]
        },
        {
          "bullets": [],
          "heading": "10. Сторонние услуги и ссылки",
          "paragraphs": [
            "Платформа может полагаться на банки, платежные каналы, поставщиков электронной почты или уведомлений, хостинг и других поставщиков услуг, а также может содержать ссылки на внешние веб-сайты. Их услуги регулируются их собственными условиями и уведомлениями о конфиденциальности. Мы не несем ответственности за независимые сторонние услуги, за исключением случаев, когда применимое право предусматривает иное."
          ]
        },
        {
          "bullets": [],
          "heading": "11. Изменения, конфликты и контакты",
          "paragraphs": [
            "Мы можем публиковать пересмотренные Условия с пересмотренной датой. Существенные изменения будут доведены до сведения через соответствующий канал Платформы или учетной записи, где это требуется. Продолжение использования после даты вступления в силу регулируется пересмотренными Условиями, за исключением случаев, когда законом требуется обновленное согласие.",
            "Если эти Условия противоречат подписанному Инвестиционному соглашению или экспортному/заказному контракту, этот подписанный документ регулирует конкретную транзакцию; императивное право всегда превалирует. Применимое право и место спора для транзакции являются теми, которые указаны в подписанном соглашении или иным образом определены в соответствии с применимым правом.",
            "Вопросы: OG Exports (Private) Limited, info@ogexports.co, https://www.ogexports.co."
          ]
        }
      ],
      "reviewStatus": "pending"
    },
    "zh-CN": {
      "title": "服务条款",
      "summary": "OG Exports (Private) Limited · 发布即生效。本条款管辖对 OG Exports 网站、投资者应用程序及相关数字服务的访问。",
      "sections": [
        {
          "bullets": [],
          "heading": "1. 关于本条款",
          "paragraphs": [
            "“OG Exports”、“我们”、“我们的”指 OG Exports (Private) Limited，一家总部位于巴基斯坦的农业出口和贸易企业。本条款管辖您对我们的网站、投资者应用程序、账户功能、支持渠道及相关服务（以下统称“本平台”）的使用。产品销售、出口订单和投资也可能受单独的书面协议管辖。",
            "如果您不同意本条款，请勿创建或继续使用账户。本条款不会放弃适用法律下的强制性权利。"
          ]
        },
        {
          "bullets": [],
          "heading": "2. 资格与账户",
          "paragraphs": [
            "您必须有法律能力在您的司法管辖区内签订具有约束力的协议。提供准确、最新的信息，并在信息变更时及时更新。在未经授权的情况下，请勿为他人创建账户。",
            "您有责任保护您的凭据、设备和验证码，并对通过您的账户执行的活动负责。如果怀疑未经授权的访问，请及时通知支持团队。我们可能要求提供身份或商业文件以满足验证、安全或法律要求。"
          ]
        },
        {
          "bullets": [],
          "heading": "3. 平台服务与状态信息",
          "paragraphs": [
            "本平台可能显示贸易机会、项目文件、投资记录、钱包余额、交易历史、付款说明、装运里程碑、支持消息和账户控制。可用性取决于相关服务及 OG Exports (Private) Limited 提供的信息。",
            "项目、融资、付款、存款、取款和装运状态在由相关系统记录或书面协议确认之前仅供参考。批准并不等同于完成，计划付款并非分配，装运更新除非明确标明，否则并非实时承运人跟踪信息。",
            "本平台显示的信息、余额、估算值和通知本身并不修改签署的协议，也不保证交易已完成。"
          ]
        },
        {
          "bullets": [],
          "heading": "4. 投资资格与协议",
          "paragraphs": [
            "投资访问权限取决于机会处于开放状态、您的账户符合既定资格审查，以及您的身份验证状态已按投资要求确认。本应用程序并不将 KYC（了解您的客户）视为存款或取款的自动条件；单独的法律、安全或交易审查可能仍然适用。",
            "每个机会都有其自身的商业详情，并可能需要单独签署《投资协议》。该协议和特定要约条款管辖投资金额、贸易、各方、货币、计算方法、结算和其他项目特定义务。本平台条款不保证任何机会均可用或会被接受。"
          ]
        },
        {
          "bullets": [],
          "heading": "5. 付款、钱包与取款",
          "paragraphs": [
            "仅使用在 OG Exports (Private) Limited 认证渠道中显示或由授权人员书面确认的付款说明。存款在相关记录确认收到并验证之前不予计入。切勿依赖通过未经验证的消息收到的变更后的银行说明。",
            "钱包货币遵循您个人资料和钱包记录的货币。在授权转换的情况下，适用的汇率和金额为该交易记录的数值；后续市场汇率不会重写历史条目。",
            "目前的取款条款为：最低银行支付额相当于 USD 100，并在所请求的支付金额上额外收取 USD 2 的固定费用（在适用情况下，按请求记录的汇率转换为钱包货币），预计处理期限为 2 个工作日。这些是当前的操作条款，而非时间保证。为您请求确认的金额、费用、货币和状态为准。"
          ]
        },
        {
          "bullets": [
            "合法使用本平台，且仅用于其预定的商业和投资者功能。",
            "不得冒充他人、提交虚假文件、操纵交易记录、干扰安全控制、探测或破坏系统、抓取受限数据，或上传非法或有害内容。",
            "不得使用本平台规避制裁、欺诈控制、出口限制、支付规则或其他适用要求。"
          ],
          "heading": "6. 可接受使用",
          "paragraphs": []
        },
        {
          "bullets": [],
          "heading": "7. 内容与知识产权",
          "paragraphs": [
            "本平台及其软件、设计、文本、标志和材料均由 OG Exports (Private) Limited 或其许可方所有。您仅可在访问服务所需的情况下使用它们。您保留您提交的文件中的权利，同时允许我们托管和处理它们以提供服务、维护记录并履行法律义务。"
          ]
        },
        {
          "bullets": [],
          "heading": "8. 可用性、暂停与终止",
          "paragraphs": [
            "出于维护、安全、法律、运营或商业原因，我们可能会更新、暂停或限制平台功能。为保护用户、调查涉嫌滥用行为或遵守法律，在合理必要的情况下，我们可能会暂停访问，并在许可的情况下尽合理努力沟通重大的账户操作。",
            "您可以通过应用内数据控制功能或公开的账户删除页面停止使用本平台并请求删除账户。提交请求后将启动支持审查；这不会立即关闭账户或擦除记录。投资、交易、会计和合规记录在法律或现有协议要求或合理的情况下可能会被保留。"
          ]
        },
        {
          "bullets": [],
          "heading": "9. 风险、建议与无承诺结果",
          "paragraphs": [
            "贸易相关投资涉及延迟、收益减少或部分/全部资本损失的可能性。不保证回报。平台信息并非个性化的财务、法律、税务或投资建议。在投入资金前，请阅读《风险披露》和适用的《投资协议》并获取适合您情况的独立建议。"
          ]
        },
        {
          "bullets": [],
          "heading": "10. 第三方服务与链接",
          "paragraphs": [
            "本平台可能依赖银行、支付渠道、电子邮件或通知提供商、托管及其他服务提供商，并可能链接到外部网站。它们的服务受其各自条款和隐私声明管辖。除适用法律另有规定外，我们不对独立的第三方服务负责。"
          ]
        },
        {
          "bullets": [],
          "heading": "11. 变更、冲突与联系方式",
          "paragraphs": [
            "我们可能会发布带有修订日期的修订版条款。在法律要求的情况下，实质性变更将通过适当的平台或账户渠道进行通报。生效日期后的继续使用受修订后条款管辖，除非法律要求续签同意。",
            "如果本条款与已签署的《投资协议》或出口/订单合同发生冲突，则以签署的文件管辖该特定交易；强制性法律始终优先。交易的管辖法律和争议解决地点为其签署协议中所述，或根据适用法律确定。",
            "问题：OG Exports (Private) Limited, info@ogexports.co, https://www.ogexports.co。"
          ]
        }
      ],
      "reviewStatus": "pending"
    },
    "fr": {
      "title": "Conditions d'utilisation",
      "summary": "OG Exports (Private) Limited · Entrée en vigueur lors de sa publication. Ces conditions régissent l'accès au site web de OG Exports (Private) Limited, à l'application pour investisseurs et aux services numériques associés.",
      "sections": [
        {
          "bullets": [],
          "heading": "1. À propos de ces Conditions",
          "paragraphs": [
            "« OG Exports (Private) Limited », « nous », « notre » et « nos » désignent OG Exports (Private) Limited, une entreprise d'exportation agricole et de négoce basée au Pakistan. Ces Conditions régissent votre utilisation de notre site web, de l'application pour investisseurs, des fonctionnalités de compte, des canaux de support et des services associés (la « Plateforme »). Les ventes de produits, les commandes d'exportation et les investissements peuvent également être régis par des accords écrits séparés.",
            "Si vous n'acceptez pas ces Conditions, ne créez pas de compte et ne continuez pas à utiliser un compte. Les droits impératifs en vertu de la loi applicable ne sont pas annulés par ces Conditions."
          ]
        },
        {
          "bullets": [],
          "heading": "2. Éligibilité et comptes",
          "paragraphs": [
            "Vous devez être légalement capable de conclure un accord contraignant dans votre juridiction. Fournissez des informations exactes et actuelles et mettez-les à jour lorsqu'elles changent. Ne créez pas de compte pour une autre personne sans autorisation.",
            "Vous êtes responsable de la protection de vos identifiants, appareils et codes de vérification, ainsi que de l'activité effectuée via votre compte. Informez rapidement le Support si vous suspectez un accès non autorisé. Nous pouvons demander des documents d'identité ou commerciaux pour répondre aux exigences de vérification, de sécurité ou légales."
          ]
        },
        {
          "bullets": [],
          "heading": "3. Services de la Plateforme et informations de statut",
          "paragraphs": [
            "La Plateforme peut afficher des opportunités de négoce, des documents de projet, des registres d'investissement, des soldes de portefeuille, l'historique des transactions, des instructions de paiement, des jalons d'expédition, des messages de support et des contrôles de compte. La disponibilité dépend du service concerné et des informations fournies par OG Exports (Private) Limited.",
            "Les statuts de projet, de financement, de paiement, de dépôt, de retrait et d'expédition sont fournis à titre informatif jusqu'à ce qu'ils soient confirmés par le registre système applicable ou un accord écrit. Une approbation n'est pas identique à une finalisation, un paiement prévu n'est pas une distribution, et une mise à jour d'expédition n'est pas un suivi de transporteur en temps réel, sauf indication expresse contraire.",
            "Les informations, soldes, estimations et notifications affichés par la Plateforme ne modifient pas en soi un accord signé et ne garantissent pas qu'une transaction est finalisée."
          ]
        },
        {
          "bullets": [],
          "heading": "4. Éligibilité à l'investissement et accords",
          "paragraphs": [
            "L'accès à l'investissement est soumis au fait que l'opportunité soit ouverte, que votre compte satisfasse aux vérifications d'éligibilité énoncées, et que votre statut de vérification d'identité soit confirmé comme requis pour investir. L'application ne traite pas le KYC comme une condition automatique pour les dépôts ou les retraits ; des vérifications légales, de sécurité ou de transaction séparées peuvent toujours s'appliquer.",
            "Chaque opportunité a ses propres détails commerciaux et peut nécessiter un Contrat d'investissement signé séparé. Cet accord et les conditions spécifiques à l'offre régissent le montant de l'investissement, le négoce, les parties, la devise, la méthode de calcul, le règlement et d'autres obligations spécifiques au projet. Ces Conditions de la Plateforme ne promettent pas qu'une opportunité sera disponible ou acceptée."
          ]
        },
        {
          "bullets": [],
          "heading": "5. Paiements, portefeuille et retraits",
          "paragraphs": [
            "Utilisez uniquement les instructions de paiement affichées dans un canal authentifié de OG Exports (Private) Limited ou confirmées par écrit par le personnel autorisé. Un dépôt n'est pas crédité tant que les registres applicables ne confirment la réception et la vérification. Ne vous fiez jamais à une instruction bancaire modifiée reçue via un message non vérifié.",
            "La devise du portefeuille suit la devise enregistrée pour votre profil et votre portefeuille. Lorsqu'une conversion est autorisée, le taux et le montant applicables sont ceux enregistrés pour cette transaction ; les taux de marché ultérieurs ne réévaluent pas les entrées historiques.",
            "Les conditions de retrait actuelles sont un paiement bancaire minimum équivalent à 100 USD, des frais fixes de 2 USD ajoutés au paiement demandé (convertis dans la devise du portefeuille en utilisant le taux enregistré de la demande le cas échéant), et une période de traitement estimée de 2 jours ouvrables. Il s'agit de conditions opérationnelles actuelles, pas d'une garantie de délai. Le montant, les frais, la devise et le statut confirmés pour votre demande prévalent."
          ]
        },
        {
          "bullets": [
            "Utilisez la Plateforme de manière licite et uniquement pour ses fonctions commerciales et d'investisseur prévues.",
            "N'usurpez pas l'identité d'une autre personne, ne soumettez pas de faux documents, ne manipulez pas les registres de transaction, n'interférez pas avec les contrôles de sécurité, ne sondez pas et ne perturbez pas les systèmes, ne grattez pas de données restreintes, et ne téléchargez pas de contenu illicite ou préjudiciable.",
            "N'utilisez pas la Plateforme pour contourner les sanctions, les contrôles de fraude, les restrictions à l'exportation, les règles de paiement ou d'autres exigences applicables."
          ],
          "heading": "6. Utilisation acceptable",
          "paragraphs": []
        },
        {
          "bullets": [],
          "heading": "7. Contenu et propriété intellectuelle",
          "paragraphs": [
            "La Plateforme, ses logiciels, sa conception, son texte, ses marques et ses documents sont la propriété de OG Exports (Private) Limited ou de ses concédants de licence. Vous pouvez les utiliser uniquement selon les besoins pour accéder aux services. Vous conservez les droits sur les documents que vous soumettez, tout en nous permettant de les héberger et de les traiter pour fournir le service, tenir des registres et respecter les obligations légales."
          ]
        },
        {
          "bullets": [],
          "heading": "8. Disponibilité, suspension et résiliation",
          "paragraphs": [
            "Nous pouvons mettre à jour, suspendre ou restreindre une fonctionnalité de la Plateforme pour des raisons de maintenance, de sécurité, légales, opérationnelles ou commerciales. Nous pouvons suspendre l'accès lorsque cela est raisonnablement nécessaire pour protéger les utilisateurs, enquêter sur une utilisation abusive suspectée ou se conformer à la loi, et nous ferons des efforts raisonnables pour communiquer les actions importantes sur le compte lorsque cela est autorisé.",
            "Vous pouvez cesser d'utiliser la Plateforme et demander la suppression de votre compte via les contrôles de données intégrés à l'application ou la page publique de suppression de compte. La soumission déclenche un examen par le Support ; cela ne ferme pas immédiatement le compte et n'efface pas les registres. Les registres d'investissement, de transaction, comptables et de conformité peuvent être conservés lorsque cela est requis ou justifié par la loi ou un accord existant."
          ]
        },
        {
          "bullets": [],
          "heading": "9. Risques, conseils et aucune promesse de résultat",
          "paragraphs": [
            "Les investissements liés au négoce impliquent la possibilité de retard, de produits réduits ou de perte d'une partie ou de la totalité du capital. Les rendements ne sont pas garantis. Les informations de la Plateforme ne constituent pas des conseils financiers, juridiques, fiscaux ou d'investissement personnalisés. Lisez la Divulgation des risques et le Contrat d'investissement applicable et obtenez des conseils indépendants adaptés à votre situation avant d'engager des fonds."
          ]
        },
        {
          "bullets": [],
          "heading": "10. Services et liens de tiers",
          "paragraphs": [
            "La Plateforme peut s'appuyer sur des banques, des canaux de paiement, des prestataires d'e-mail ou de notification, des hébergeurs et d'autres prestataires de services, et peut créer des liens vers des sites web externes. Leurs services sont soumis à leurs propres conditions et avis de confidentialité. Nous ne sommes pas responsables des services tiers indépendants, sauf dans la mesure où la loi applicable en dispose autrement."
          ]
        },
        {
          "bullets": [],
          "heading": "11. Changements, conflits et contact",
          "paragraphs": [
            "Nous pouvons publier des Conditions révisées avec une date révisée. Les changements importants seront communiqués via un canal de Plateforme ou de compte approprié lorsque requis. L'utilisation continue après la date d'entrée en vigueur est soumise aux Conditions révisées, sauf lorsque le consentement renouvelé est requis par la loi.",
            "Si ces Conditions entrent en conflit avec un Contrat d'investissement signé ou un contrat d'exportation/commande, ce document signé prévaut pour la transaction spécifique ; la loi impérative prévaut toujours. La loi applicable et le lieu de règlement des litiges pour une transaction sont ceux énoncés dans son accord signé ou autrement déterminés en vertu de la loi applicable.",
            "Questions : OG Exports (Private) Limited, info@ogexports.co, https://www.ogexports.co."
          ]
        }
      ],
      "reviewStatus": "pending"
    },
    "es": {
      "title": "Términos de Servicio",
      "summary": "OG Exports (Private) Limited · Efectiva desde su publicación. Estos términos rigen el acceso al sitio web de OG Exports, la aplicación para inversores y servicios digitales relacionados.",
      "sections": [
        {
          "bullets": [],
          "heading": "1. Acerca de estos Términos",
          "paragraphs": [
            "“OG Exports”, “nosotros”, “nuestro” y “nos” se refieren a OG Exports (Private) Limited, un negocio de exportación y comercio agrícola basado en Pakistán. Estos Términos rigen su uso de nuestro sitio web, aplicación para inversores, funciones de cuenta, canales de soporte y servicios relacionados (la “Plataforma”). Las ventas de productos, pedidos de exportación e inversiones también pueden estar regidos por acuerdos escritos separados.",
            "Si no está de acuerdo con estos Términos, no cree ni continúe usando una cuenta. Los derechos obligatorios bajo la ley aplicable no son renunciados por estos Términos."
          ]
        },
        {
          "bullets": [],
          "heading": "2. Elegibilidad y cuentas",
          "paragraphs": [
            "Debe ser legalmente capaz de celebrar un acuerdo vinculante en su jurisdicción. Proporcione información precisa y actual, y actualícela cuando cambie. No cree una cuenta para otra persona sin autoridad.",
            "Usted es responsable de salvaguardar sus credenciales, dispositivos y códigos de verificación, y de la actividad realizada a través de su cuenta. Notifique al Soporte de inmediato si sospecha acceso no autorizado. Podemos solicitar documentos de identidad o comerciales para cumplir con requisitos de verificación, seguridad o legales."
          ]
        },
        {
          "bullets": [],
          "heading": "3. Servicios de la Plataforma e información de estado",
          "paragraphs": [
            "La Plataforma puede mostrar oportunidades comerciales, documentos de proyectos, registros de inversión, saldos de billetera, historial de transacciones, instrucciones de pago, hitos de envío, mensajes de soporte y controles de cuenta. La disponibilidad depende del servicio relevante y la información suministrada por OG Exports.",
            "Los estados de proyecto, financiación, pago, depósito, retiro y envío son informativos hasta que sean confirmados por el registro del sistema aplicable o acuerdo escrito. Una aprobación no es lo mismo que la finalización, un pago planeado no es una distribución, y una actualización de envío no es un seguimiento de transportista en vivo a menos que se identifique expresamente como tal.",
            "La información, saldos, estimaciones y notificaciones mostradas por la Plataforma no modifican por sí mismas un acuerdo firmado ni garantizan que una transacción se haya completado."
          ]
        },
        {
          "bullets": [],
          "heading": "4. Elegibilidad de inversión y acuerdos",
          "paragraphs": [
            "El acceso a la inversión está sujeto a que la oportunidad esté abierta, a que su cuenta cumpla con las verificaciones de elegibilidad establecidas y a que su estado de verificación de identidad esté confirmado según sea necesario para invertir. La aplicación no trata el KYC como una condición automática para depósitos o retiros; verificaciones legales, de seguridad o de transacción separadas aún pueden aplicar.",
            "Cada oportunidad tiene sus propios detalles comerciales y puede requerir un Acuerdo de Inversión firmado por separado. Ese acuerdo y los términos específicos de la oferta controlan el monto de la inversión, el comercio, las partes, la moneda, el método de cálculo, la liquidación y otras obligaciones específicas del proyecto. Estos Términos de la Plataforma no prometen que ninguna oportunidad estará disponible o será aceptada."
          ]
        },
        {
          "bullets": [],
          "heading": "5. Pagos, billetera y retiros",
          "paragraphs": [
            "Utilice solo las instrucciones de pago mostradas en un canal autenticado de OG Exports o confirmadas por escrito por personal autorizado. Un depósito no se acredita hasta que los registros aplicables confirmen la recepción y verificación. Nunca confíe en una instrucción bancaria cambiada recibida a través de un mensaje no verificado.",
            "La moneda de la billetera sigue la moneda registrada para su perfil y billetera. Donde se autoriza una conversión, la tasa y el monto aplicables son los registrados para esa transacción; las tasas de mercado posteriores no reescriben las entradas históricas.",
            "Los términos de retiro actuales son un pago bancario mínimo equivalente a USD 100, una tarifa fija de USD 2 agregada sobre el pago solicitado (convertida a la moneda de la billetera utilizando la tasa registrada de la solicitud cuando corresponda), y un periodo de procesamiento estimado de 2 días hábiles. Estos son términos operativos actuales, no una garantía de tiempo. El monto, la tarifa, la moneda y el estado confirmados para su solicitud son los que rigen."
          ]
        },
        {
          "bullets": [
            "Utilice la Plataforma legalmente y solo para sus funciones comerciales e inversoras previstas.",
            "No se haga pasar por otra persona, presente documentos falsos, manipule registros de transacciones, interfiera con controles de seguridad, sondee o interrumpa sistemas, extraiga datos restringidos, o cargue contenido ilegal o dañino.",
            "No utilice la Plataforma para evadir sanciones, controles de fraude, restricciones de exportación, reglas de pago u otros requisitos aplicables."
          ],
          "heading": "6. Uso aceptable",
          "paragraphs": []
        },
        {
          "bullets": [],
          "heading": "7. Contenido y propiedad intelectual",
          "paragraphs": [
            "La Plataforma, su software, diseño, texto, marcas y materiales son propiedad de OG Exports (Private) Limited o sus licenciantes. Usted puede usarlos solo según sea necesario para acceder a los servicios. Usted retiene los derechos sobre los documentos que envía, mientras nos permite alojarlos y procesarlos para proporcionar el servicio, mantener registros y cumplir con obligaciones legales."
          ]
        },
        {
          "bullets": [],
          "heading": "8. Disponibilidad, suspensión y terminación",
          "paragraphs": [
            "Podemos actualizar, pausar o restringir una función de la Plataforma por razones de mantenimiento, seguridad, legales, operativas o comerciales. Podemos suspender el acceso cuando sea razonablemente necesario para proteger a los usuarios, investigar mal uso sospechoso o cumplir con la ley, y haremos esfuerzos razonables para comunicar acciones materiales de la cuenta cuando esté permitido.",
            "Usted puede dejar de usar la Plataforma y solicitar la eliminación de la cuenta a través de los controles de datos dentro de la aplicación o la página pública de eliminación de cuentas. La presentación inicia una revisión de Soporte; no cierra inmediatamente la cuenta ni borra registros. Los registros de inversión, transacciones, contabilidad y cumplimiento pueden conservarse donde sea requerido o justificado por la ley o un acuerdo existente."
          ]
        },
        {
          "bullets": [],
          "heading": "9. Riesgo, asesoramiento y sin resultados prometidos",
          "paragraphs": [
            "Las inversiones relacionadas con el comercio implican la posibilidad de retraso, ingresos reducidos o pérdida de parte o la totalidad del capital. Los rendimientos no están garantizados. La información de la Plataforma no es asesoramiento financiero, legal, fiscal o de inversión individualizado. Lea la Divulgación de Riesgos y el Acuerdo de Inversión aplicable y obtenga asesoramiento independiente adecuado a sus circunstancias antes de comprometer fondos."
          ]
        },
        {
          "bullets": [],
          "heading": "10. Servicios de terceros y enlaces",
          "paragraphs": [
            "La Plataforma puede depender de bancos, canales de pago, proveedores de correo electrónico o notificación, alojamiento y otros proveedores de servicios, y puede vincular a sitios web externos. Sus servicios están sujetos a sus propios términos y avisos de privacidad. No somos responsables de los servicios de terceros independientes, excepto en la medida en que la ley aplicable disponga lo contrario."
          ]
        },
        {
          "bullets": [],
          "heading": "11. Cambios, conflictos y contacto",
          "paragraphs": [
            "Podemos publicar Términos revisados con una fecha revisada. Los cambios materiales se comunicarán a través de una Plataforma o canal de cuenta apropiado donde sea necesario. El uso continuado después de la fecha efectiva está sujeto a los Términos revisados, excepto cuando se requiera consentimiento renovado por ley.",
            "Si estos Términos entran en conflicto con un Acuerdo de Inversión firmado o contrato de exportación/pedido, ese documento firmado controla la transacción específica; la ley imperativa siempre prevalece. La ley aplicable y el lugar de disputa para una transacción son los establecidos en su acuerdo firmado o determinados de otra manera bajo la ley aplicable.",
            "Preguntas: OG Exports (Private) Limited, info@ogexports.co, https://www.ogexports.co."
          ]
        }
      ],
      "reviewStatus": "pending"
    },
    "de": {
      "title": "Nutzungsbedingungen",
      "summary": "OG Exports (Private) Limited · Wirksam bei Veröffentlichung. Diese Bedingungen regeln den Zugang zur Website von OG Exports, der Investoren-App und verwandten digitalen Diensten.",
      "sections": [
        {
          "bullets": [],
          "heading": "1. Über diese Bedingungen",
          "paragraphs": [
            "„OG Exports“, „wir“, „unsere“ und „uns“ beziehen sich auf OG Exports (Private) Limited, ein in Pakistan ansässiges Export- und Handelsunternehmen für Agrarprodukte. Diese Bedingungen regeln Ihre Nutzung unserer Website, Investoren-App, Kontofunktionen, Support-Kanäle und verwandten Dienste (die „Plattform“). Produktverkäufe, Exportaufträge und Investitionen können auch durch separate schriftliche Verträge geregelt werden.",
            "Wenn Sie diesen Bedingungen nicht zustimmen, erstellen Sie kein Konto oder fahren Sie nicht mit dessen Nutzung fort. Zwingende Rechte nach anwendbarem Recht werden durch diese Bedingungen nicht ausgeschlossen."
          ]
        },
        {
          "bullets": [],
          "heading": "2. Teilnahmeberechtigung und Konten",
          "paragraphs": [
            "Sie müssen in der Lage sein, rechtsverbindliche Verträge in Ihrer Gerichtsbarkeit einzugehen. Stellen Sie genaue, aktuelle Informationen bereit und aktualisieren Sie diese bei Änderungen. Erstellen Sie kein Konto für eine andere Person ohne Befugnis.",
            "Sie sind verantwortlich für den Schutz Ihrer Anmeldedaten, Geräte und Verifizierungscodes sowie für Aktivitäten, die über Ihr Konto durchgeführt werden. Informieren Sie den Support umgehend, wenn Sie unbefugten Zugriff vermuten. Wir können Identitäts- oder Geschäftsdokumente anfordern, um Verifizierungs-, Sicherheits- oder rechtliche Anforderungen zu erfüllen."
          ]
        },
        {
          "bullets": [],
          "heading": "3. Plattformdienste und Statusinformationen",
          "paragraphs": [
            "Die Plattform kann Handelsmöglichkeiten, Projektunterlagen, Investitionsaufzeichnungen, Wallet-Guthaben, Transaktionsverläufe, Zahlungsanweisungen, Versandmeilensteine, Support-Nachrichten und Kontokontrollen anzeigen. Die Verfügbarkeit hängt vom relevanten Dienst und den von OG Exports (Private) Limited bereitgestellten Informationen ab.",
            "Projekt-, Finanzierungs-, Zahlungs-, Einzahlungs-, Auszahlungs- und Versandstatus sind informativ, bis sie durch die entsprechende Systemaufzeichnung oder einen schriftlichen Vertrag bestätigt werden. Eine Genehmigung ist nicht dasselbe wie ein Abschluss, eine geplante Auszahlung ist keine Ausschüttung, und ein Versand-Update ist kein Live-Carrier-Tracking, sofern es nicht ausdrücklich als solches gekennzeichnet ist.",
            "Informationen, Guthaben, Schätzungen und Benachrichtigungen, die von der Plattform angezeigt werden, ändern für sich genommen keinen unterzeichneten Vertrag und garantieren nicht, dass eine Transaktion abgeschlossen wurde."
          ]
        },
        {
          "bullets": [],
          "heading": "4. Investitionsberechtigung und Verträge",
          "paragraphs": [
            "Der Zugang zu Investitionen hängt davon ab, dass die Gelegenheit offen ist, Ihr Konto die angegebenen Berechtigungsprüfungen erfüllt und Ihr Identitätsverifizierungsstatus wie für Investitionen erforderlich bestätigt ist. Die Anwendung behandelt KYC nicht als automatische Bedingung für Ein- oder Auszahlungen; separate rechtliche, Sicherheits- oder Transaktionsprüfungen können weiterhin gelten.",
            "Jede Gelegenheit hat ihre eigenen kommerziellen Details und kann einen separaten unterzeichneten Investitionsvertrag erfordern. Dieser Vertrag und die angebots-spezifischen Bedingungen regeln den Investitionsbetrag, den Handel, die Parteien, die Währung, die Berechnungsmethode, die Abwicklung und andere projektspezifische Verpflichtungen. Diese Plattformbedingungen versprechen nicht, dass irgendeine Gelegenheit verfügbar sein wird oder akzeptiert wird."
          ]
        },
        {
          "bullets": [],
          "heading": "5. Zahlungen, Wallet und Auszahlungen",
          "paragraphs": [
            "Verwenden Sie nur Zahlungsanweisungen, die in einem authentifizierten OG Exports (Private) Limited-Kanal angezeigt oder schriftlich von autorisiertem Personal bestätigt wurden. Eine Einzahlung wird erst gutgeschrieben, wenn die entsprechenden Aufzeichnungen den Eingang und die Verifizierung bestätigen. Vertrauen Sie niemals einer geänderten Bankanweisung, die über eine nicht verifizierte Nachricht empfangen wurde.",
            "Die Wallet-Währung folgt der für Ihr Profil und Wallet aufgezeichneten Währung. Wo eine Umrechnung autorisiert ist, sind der anwendbare Kurs und Betrag diejenigen, die für diese Transaktion aufgezeichnet wurden; spätere Marktpreise schreiben historische Einträge nicht um.",
            "Aktuelle Auszahlungsbedingungen sind eine Mindestauszahlung von umgerechnet USD 100, eine pauschale Gebühr von USD 2 zusätzlich zur angeforderten Auszahlung (umgerechnet in die Wallet-Währung unter Verwendung des aufgezeichneten Kurses der Anfrage, sofern anwendbar) und eine geschätzte Bearbeitungszeit von 2 Arbeitstagen. Dies sind aktuelle operative Bedingungen, keine Garantie für den Zeitpunkt. Der für Ihre Anfrage bestätigte Betrag, die Gebühr, die Währung und der Status sind maßgeblich."
          ]
        },
        {
          "bullets": [
            "Nutzen Sie die Plattform rechtmäßig und nur für ihre beabsichtigten Geschäfts- und Investorenfunktionen.",
            "Geben Sie sich nicht als eine andere Person aus, reichen Sie keine falschen Dokumente ein, manipulieren Sie keine Transaktionsaufzeichnungen, greifen Sie nicht in Sicherheitskontrollen ein, untersuchen oder stören Sie keine Systeme, scrapen Sie keine eingeschränkten Daten und laden Sie keine rechtswidrigen oder schädlichen Inhalte hoch.",
            "Nutzen Sie die Plattform nicht, um Sanktionen, Betrugskontrollen, Exportbeschränkungen, Zahlungsregeln oder andere anwendbare Anforderungen zu umgehen."
          ],
          "heading": "6. Zulässige Nutzung",
          "paragraphs": []
        },
        {
          "bullets": [],
          "heading": "7. Inhalte und geistiges Eigentum",
          "paragraphs": [
            "Die Plattform, ihre Software, ihr Design, ihr Text, ihre Marken und Materialien sind Eigentum von OG Exports (Private) Limited oder deren Lizenzgebern. Sie dürfen diese nur so weit verwenden, wie dies für den Zugriff auf die Dienste erforderlich ist. Sie behalten Rechte an Dokumenten, die Sie einreichen, während Sie uns erlauben, sie zu hosten und zu verarbeiten, um den Dienst bereitzustellen, Aufzeichnungen zu führen und gesetzliche Verpflichtungen zu erfüllen."
          ]
        },
        {
          "bullets": [],
          "heading": "8. Verfügbarkeit, Aussetzung und Kündigung",
          "paragraphs": [
            "Wir können eine Plattformfunktion aus Wartungs-, Sicherheits-, rechtlichen, operativen oder kommerziellen Gründen aktualisieren, pausieren oder einschränken. Wir können den Zugang aussetzen, wenn dies vernünftigerweise erforderlich ist, um Benutzer zu schützen, vermuteten Missbrauch zu untersuchen oder Gesetze einzuhalten, und werden angemessene Anstrengungen unternehmen, um wesentliche Kontoaktionen zu kommunizieren, wo dies zulässig ist.",
            "Sie können die Nutzung der Plattform beenden und die Kontolöschung über die In-App-Datenkontrollen oder die öffentliche Seite zur Kontolöschung anfordern. Die Einreichung startet eine Support-Überprüfung; dies schließt das Konto nicht sofort und löscht keine Aufzeichnungen. Investitions-, Transaktions-, Buchhaltungs- und Compliance-Aufzeichnungen können aufbewahrt werden, wo dies gesetzlich erforderlich oder durch einen bestehenden Vertrag gerechtfertigt ist."
          ]
        },
        {
          "bullets": [],
          "heading": "9. Risiko, Beratung und kein garantiertes Ergebnis",
          "paragraphs": [
            "Handelsbezogene Investitionen beinhalten die Möglichkeit von Verzögerungen, reduzierten Erträgen oder dem Verlust eines Teils oder des gesamten Kapitals. Renditen sind nicht garantiert. Plattforminformationen sind keine individualisierte Finanz-, Rechts-, Steuer- oder Anlageberatung. Lesen Sie die Risikohinweis-Erklärung und den anwendbaren Investitionsvertrag und holen Sie unabhängigen Rat ein, der Ihrer Situation angemessen ist, bevor Sie Gelder festlegen."
          ]
        },
        {
          "bullets": [],
          "heading": "10. Drittanbieterdienste und Links",
          "paragraphs": [
            "Die Plattform kann auf Banken, Zahlungskanäle, E-Mail- oder Benachrichtigungsanbieter, Hosting- und andere Dienstleister angewiesen sein und kann auf externe Websites verlinken. Deren Dienste unterliegen ihren eigenen Bedingungen und Datenschutzhinweisen. Wir sind nicht verantwortlich für unabhängige Dienste Dritter, es sei denn, anwendbares Recht sieht dies anders vor."
          ]
        },
        {
          "bullets": [],
          "heading": "11. Änderungen, Konflikte und Kontakt",
          "paragraphs": [
            "Wir können überarbeitete Bedingungen mit einem geänderten Datum veröffentlichen. Wesentliche Änderungen werden über einen geeigneten Plattform- oder Kontokanal kommuniziert, wo dies erforderlich ist. Die fortgesetzte Nutzung nach dem Datum des Inkrafttretens unterliegt den überarbeiteten Bedingungen, außer wenn eine erneute Zustimmung gesetzlich vorgeschrieben ist.",
            "Wenn diese Bedingungen mit einem unterzeichneten Investitionsvertrag oder Export-/Auftragsvertrag in Konflikt stehen, ist dieses unterzeichnete Dokument für die spezifische Transaktion maßgeblich; zwingendes Recht hat immer Vorrang. Das anwendbare Recht und der Streitort für eine Transaktion sind die im jeweiligen unterzeichneten Vertrag angegebenen oder anderweitig nach anwendbarem Recht bestimmten.",
            "Fragen: OG Exports (Private) Limited, info@ogexports.co, https://www.ogexports.co."
          ]
        }
      ],
      "reviewStatus": "pending"
    }
  },
  "privacy": {
    "ru": {
      "title": "Политика конфиденциальности",
      "summary": "OG Exports (Private) Limited · Вступает в силу с момента публикации. Эта Политика объясняет, как обрабатывается информация при использовании цифровых сервисов OG Exports.",
      "sections": [
        {
          "bullets": [],
          "heading": "1. Кто мы и сфера применения",
          "paragraphs": [
            "OG Exports (Private) Limited осуществляет экспорт сельскохозяйственной продукции, торговлю и инвесторские услуги из Пакистана. Данная Политика применяется к нашему веб-сайту, приложению для инвесторов, учетным записям, коммуникациям поддержки и сопутствующим цифровым услугам. Её следует читать вместе с Пользовательским соглашением и конкретными условиями транзакции."
          ]
        },
        {
          "bullets": [
            "Данные учетной записи и контактные данные: имя, адрес электронной почты, дополнительный номер мобильного телефона, страна, детали профиля и коммуникации.",
            "Данные для верификации: документы, удостоверяющие личность, адрес или деловые документы, а также связанный статус проверки, когда это требуется для соответствующей услуги.",
            "Финансовые и торговые записи: банковские/платежные реквизиты, запросы на внесение и вывод средств, инвестиционное участие, идентификаторы транзакций, записи кошельков и валют, подписанные соглашения, документы по проекту и информация об отгрузке/заказах.",
            "Данные поддержки и предпочтений: сообщения, запросы на права доступа к данным, выбор уведомлений, настройки языка и отображения.",
            "Технические данные и данные безопасности: устройство, браузер, IP-адрес/информация о сеансе, события входа и аудита, а также записи об ошибках или использовании, созданные Платформой."
          ],
          "heading": "2. Информация, которую мы можем собирать",
          "paragraphs": []
        },
        {
          "bullets": [
            "Создание и защита учетных записей; аутентификация пользователей; оказание поддержки и поддержание запрошенных настроек.",
            "Проверка личности или деловой состоятельности, где применимо; администрирование возможностей и соглашений; ведение точных торговых, платежных и инвесторских записей.",
            "Отображение активности учетной записи, сообщение об изменениях статуса верификации, доставка запрошенных уведомлений и расследование ошибок или предполагаемого неправильного использования.",
            "Защита Платформы, выполнение договорных и юридических обязательств, реагирование на законные запросы, разрешение споров и ведение необходимых деловых записей."
          ],
          "heading": "3. Как мы используем информацию",
          "paragraphs": []
        },
        {
          "bullets": [],
          "heading": "4. Юридическая и операционная база",
          "paragraphs": [
            "В зависимости от услуги и применимого права, мы обрабатываем информацию для предоставления запрошенной услуги, исполнения или администрирования соглашения, защиты пользователей и Платформы, выполнения юридических обязательств или реализации законных операционных интересов. Там, где требуется согласие, мы будем запрашивать его, и вы можете отозвать его с учетом юридических и договорных ограничений."
          ]
        },
        {
          "bullets": [],
          "heading": "5. Обмен данными и поставщики услуг",
          "paragraphs": [
            "Мы не продаем личную информацию. Мы можем раскрывать только ту информацию, которая разумно необходима, уполномоченному персоналу, банкам и платежным каналам, участвующим в вашей транзакции, поставщикам услуг, обеспечивающим хостинг, аутентификацию, электронную почту или уведомления, профессиональным консультантам, регулирующим или правоохранительным органам, когда это требуется по закону, а также сторонам, необходимым для защиты прав или расследования мошенничества. Электронные письма для аутентификации инвесторов могут доставляться с использованием Resend; push-уведомления могут использовать Expo, если они включены для вашего устройства. Поставщики услуг электронной почты поддержки, хостинга, хранения и платежей зависят от услуги и конфигурации, используемой OG Exports (Private) Limited. Поставщики должны обрабатывать информацию в целях оказания своих услуг и в соответствии с применимыми гарантиями.",
            "Мы не публикуем ваши частные инвестиционные или идентификационные записи. Конкретная транзакция может потребовать обмена соответствующими деталями с контрагентами, финансовыми учреждениями или властями; применимое соглашение и закон регулируют такое раскрытие."
          ]
        },
        {
          "bullets": [],
          "heading": "6. Международная обработка",
          "paragraphs": [
            "Вы можете получить доступ к Платформе из-за пределов Пакистана. Информация может обрабатываться в Пакистане и в других местах, где работают инфраструктура или поставщики услуг. Трансграничная обработка регулируется применимым правом и гарантиями, соответствующими услуге. Свяжитесь с нами, если вам нужны подробности о конкретной передаче."
          ]
        },
        {
          "bullets": [],
          "heading": "7. Хранение и удаление",
          "paragraphs": [
            "Мы храним информацию столько, сколько необходимо для предоставления услуг, администрирования соглашений, ведения финансовых и торговых записей, защиты безопасности учетной записи, разрешения споров и выполнения юридических, бухгалтерских или регуляторных требований. Сроки хранения зависят от записи и применимого обязательства.",
            "Вы можете запросить доступ, исправление или удаление через элементы управления данными в приложении или на сайте https://www.ogexports.co/delete-account. Служба поддержки проверит владение учетной записью и рассмотрит активные инвестиции и обязательства по хранению. Приемлемые личные данные будут удалены или анонимизированы; записи, которые должны остаться, могут храниться с доступом, ограниченным соответствующими целями. Запрос сам по себе не означает немедленного закрытия учетной записи или удаления записей."
          ]
        },
        {
          "bullets": [],
          "heading": "8. Безопасность и файлы cookie",
          "paragraphs": [
            "Мы используем средства контроля доступа и технические и организационные меры безопасности, предназначенные для защиты информации. Никакая интернет-передача или система хранения не могут быть гарантированно полностью безопасными. Храните учетные данные в секрете и немедленно сообщайте в службу поддержки о предполагаемом скомпрометированном доступе.",
            "Веб-сайт может использовать необходимые файлы cookie или аналогичные технологии для сеансов, безопасности и предпочтений. Их отключение может повлиять на вход или другие функции. Любая дополнительная аналитика или аналогичные технологии, если они включены, подлежат применимым настройкам и закону."
          ]
        },
        {
          "bullets": [],
          "heading": "9. Дети и права личности",
          "paragraphs": [
            "Сервисы предназначены для лиц, юридически способных заключать соответствующие соглашения, и не предназначены для детей. Мы намеренно не собираем личную информацию у детей. Если вы считаете, что ребенок предоставил информацию, свяжитесь со службой поддержки.",
            "В зависимости от применимого права, вы можете запросить доступ, исправление, удаление, копию доступных данных или изменения в дополнительных коммуникациях. Нам может потребоваться подтвердить вашу личность, и мы можем хранить записи, требуемые по юридическим или договорным причинам."
          ]
        },
        {
          "bullets": [],
          "heading": "10. Обновления и контакты по вопросам конфиденциальности",
          "paragraphs": [
            "Мы можем обновлять эту Политику и публиковать пересмотренную дату. Существенные изменения будут доведены до сведения там, где это требуется по закону.",
            "Запросы по вопросам конфиденциальности и данных: OG Exports (Private) Limited, info@ogexports.co, https://www.ogexports.co. Запросы на удаление учетной записи также могут быть сделаны по адресу https://www.ogexports.co/delete-account."
          ]
        }
      ],
      "reviewStatus": "pending"
    },
    "zh-CN": {
      "title": "隐私政策",
      "summary": "OG Exports (Private) Limited · 发布即生效。本政策说明当您使用 OG Exports 数字服务时信息如何被处理。",
      "sections": [
        {
          "bullets": [],
          "heading": "1. 我们是谁及范围",
          "paragraphs": [
            "OG Exports (Private) Limited 在巴基斯坦运营农业出口、贸易和投资者服务。本政策适用于我们的网站、投资者应用程序、账户、支持通信及相关数字服务。本政策应与《用户协议》及特定交易条款一并阅读。"
          ]
        },
        {
          "bullets": [
            "账户和联系详情：姓名、电子邮件、可选的手机号码、国家/地区、个人资料详情及通信记录。",
            "验证详情：身份、地址或商业文件，以及在特定服务要求时相关的审查状态。",
            "财务和贸易记录：银行/付款参考、存款和取款请求、投资参与情况、交易标识符、钱包和货币记录、签署的协议、项目文件及装运/订单信息。",
            "支持和偏好数据：消息、数据权利请求、通知选择、语言和显示设置。",
            "技术和安全数据：由平台生成的设备、浏览器、IP/会话信息、登录和审计事件，以及错误或使用记录。"
          ],
          "heading": "2. 我们可能收集的信息",
          "paragraphs": []
        },
        {
          "bullets": [
            "创建并保护账户；验证用户身份；提供支持并维护所要求的偏好设置。",
            "在适用的情况下审查身份或商业资格，管理机会和协议，并维护准确的贸易、付款和投资者记录。",
            "显示账户活动，通报已验证的状态变更，发送所要求的通知，并调查错误或涉嫌滥用的行为。",
            "保护平台，履行合同和法律义务，响应合法请求，解决争议并维护必要的商业记录。"
          ],
          "heading": "3. 我们如何使用信息",
          "paragraphs": []
        },
        {
          "bullets": [],
          "heading": "4. 法律和运营依据",
          "paragraphs": [
            "根据服务和适用法律，我们处理信息是为了提供所要求的服务、履行或管理协议、保护用户和平台、履行法律义务或追求合法的运营利益。在需要同意的情况下，我们将请求您的同意，且您可在法律和合同限制内撤回该同意。"
          ]
        },
        {
          "bullets": [],
          "heading": "5. 共享与服务提供商",
          "paragraphs": [
            "我们不会出售个人信息。我们仅可能向涉及您交易的授权人员、银行和支付渠道、支持托管/身份验证/电子邮件或通知的服务提供商、专业顾问、法律要求的监管或执法机构，以及为保护权利或调查欺诈所需的各方披露合理需要的信息。投资者身份验证邮件可能通过 Resend 发送；推送通知在您的设备启用时可能使用 Expo。支持电子邮件、托管、存储和支付提供商取决于 OG Exports (Private) Limited 使用的服务和配置。提供商应基于其服务目的并在适用的保障措施下处理信息。",
            "我们不会发布您的私人投资或身份记录。特定交易可能要求与交易对手、金融机构或当局共享相关详情；适用协议和法律管辖此类披露。"
          ]
        },
        {
          "bullets": [],
          "heading": "6. 国际处理",
          "paragraphs": [
            "您可能会在巴基斯坦境外访问本平台。信息可能在巴基斯坦及基础设施或服务提供商运营的其他地点进行处理。跨境处理须遵守适用法律及适合该服务的保障措施。如需特定传输的详情，请联系我们。"
          ]
        },
        {
          "bullets": [],
          "heading": "7. 保留与删除",
          "paragraphs": [
            "我们在提供服务、管理协议、维护财务和贸易记录、保护账户安全、解决争议以及满足法律、会计或监管要求所需的时间内保留信息。保留期取决于记录和适用义务。",
            "您可以通过应用内数据控制功能或 https://www.ogexports.co/delete-account 请求访问、更正或删除信息。支持团队将验证账户所有权并审查活跃投资和保留义务。合格的个人数据将被删除或匿名化；必须保留的记录可能以仅限于适当目的的访问方式予以保留。删除请求本身并不会立即关闭账户或擦除记录。"
          ]
        },
        {
          "bullets": [],
          "heading": "8. 安全与 Cookie",
          "paragraphs": [
            "我们使用旨在保护信息的访问控制以及技术和组织保障措施。任何互联网传输或存储系统都无法保证绝对安全。请保持凭据私密，并在怀疑账户泄露时立即告知支持团队。",
            "网站可能出于会话、安全和偏好的目的使用必要的 Cookie 或类似技术。禁用它们可能会影响登录或其他功能。任何已启用的可选分析或类似技术均受适用设置和法律管辖。"
          ]
        },
        {
          "bullets": [],
          "heading": "9. 儿童与个人权利",
          "paragraphs": [
            "本服务旨在供有法律能力签署相关协议的人士使用，并非为儿童设计。我们不会故意寻求从儿童处收集个人信息。如果您认为有儿童提供了信息，请联系支持团队。",
            "根据适用法律，您可能请求访问、更正、删除、获取可用数据的副本，或更改可选通信。我们可能需要验证您的身份，并可能保留出于法律或合同原因所需的记录。"
          ]
        },
        {
          "bullets": [],
          "heading": "10. 更新与隐私联系方式",
          "paragraphs": [
            "我们可能会更新本政策并发布修订日期。法律要求的情况下，实质性变更将进行通报。",
            "隐私和数据请求：OG Exports (Private) Limited, info@ogexports.co, https://www.ogexports.co。账户删除请求也可通过 https://www.ogexports.co/delete-account 提出。"
          ]
        }
      ],
      "reviewStatus": "pending"
    },
    "fr": {
      "title": "Politique de confidentialité",
      "summary": "OG Exports (Private) Limited · Entrée en vigueur lors de sa publication. Cette Politique explique comment les informations sont traitées lorsque vous utilisez les services numériques de OG Exports (Private) Limited.",
      "sections": [
        {
          "bullets": [],
          "heading": "1. Qui nous sommes et portée",
          "paragraphs": [
            "OG Exports (Private) Limited exploite des services d'exportation agricole, de négoce et d'investissement depuis le Pakistan. Cette Politique s'applique à notre site web, à l'application pour investisseurs, aux comptes, aux communications de support et aux services numériques associés. Elle doit être lue conjointement avec le Contrat d'utilisation et les conditions spécifiques à une transaction."
          ]
        },
        {
          "bullets": [
            "Détails du compte et de contact : nom, e-mail, numéro de mobile facultatif, pays, détails du profil et communications.",
            "Détails de vérification : identité, adresse ou documents commerciaux et statut de l'examen associé lorsqu'ils sont demandés pour un service applicable.",
            "Registres financiers et commerciaux : références bancaires/de paiement, demandes de dépôt et de retrait, participation à l'investissement, identifiants de transaction, registres de portefeuille et de devise, accords signés, documents de projet et informations d'expédition/commande.",
            "Données de support et de préférence : messages, demandes de droits sur les données, choix de notification, paramètres de langue et d'affichage.",
            "Données techniques et de sécurité : informations sur l'appareil, le navigateur, l'IP/session, événements de connexion et d'audit, et registres d'erreurs ou d'utilisation générés par la Plateforme."
          ],
          "heading": "2. Informations que nous pouvons collecter",
          "paragraphs": []
        },
        {
          "bullets": [
            "Créer et sécuriser les comptes ; authentifier les utilisateurs ; fournir un support et maintenir les préférences demandées.",
            "Examiner l'éligibilité de l'identité ou de l'entreprise le cas échéant, administrer les opportunités et les accords, et tenir des registres commerciaux, de paiement et d'investissement précis.",
            "Afficher l'activité du compte, communiquer les changements de statut vérifié, envoyer les notifications demandées et enquêter sur les erreurs ou les utilisations abusives suspectées.",
            "Protéger la Plateforme, respecter les obligations contractuelles et légales, répondre aux demandes légales, résoudre les litiges et tenir les registres commerciaux requis."
          ],
          "heading": "3. Comment nous utilisons les informations",
          "paragraphs": []
        },
        {
          "bullets": [],
          "heading": "4. Base juridique et opérationnelle",
          "paragraphs": [
            "Selon le service et la loi applicable, nous traitons les informations pour fournir un service demandé, exécuter ou administrer un accord, protéger les utilisateurs et la Plateforme, respecter des obligations légales, ou poursuivre des intérêts opérationnels légitimes. Lorsque le consentement est requis, nous le demanderons et vous pourrez le retirer sous réserve des limites légales et contractuelles."
          ]
        },
        {
          "bullets": [],
          "heading": "5. Partage et prestataires de services",
          "paragraphs": [
            "Nous ne vendons pas d'informations personnelles. Nous pouvons divulguer uniquement les informations raisonnablement nécessaires au personnel autorisé, aux banques et aux canaux de paiement impliqués dans votre transaction, aux prestataires de services qui prennent en charge l'hébergement, l'authentification, l'e-mail ou les notifications, aux conseillers professionnels, aux régulateurs ou aux organismes d'application de la loi lorsque la loi l'exige, et aux parties nécessaires pour protéger les droits ou enquêter sur la fraude. Les e-mails d'authentification des investisseurs peuvent être envoyés via Resend ; les notifications push peuvent utiliser Expo lorsqu'elles sont activées pour votre appareil. Les prestataires d'e-mail de support, d'hébergement, de stockage et de paiement dépendent du service et de la configuration utilisés par OG Exports (Private) Limited. Les prestataires doivent traiter les informations aux fins de leur service et conformément aux garanties applicables.",
            "Nous ne publions pas vos registres privés d'investissement ou d'identité. Une transaction spécifique peut nécessiter le partage de détails pertinents avec des contreparties, des institutions financières ou des autorités ; l'accord applicable et la loi régissent cette divulgation."
          ]
        },
        {
          "bullets": [],
          "heading": "6. Traitement international",
          "paragraphs": [
            "Vous pouvez accéder à la Plateforme depuis l'extérieur du Pakistan. Les informations peuvent être traitées au Pakistan et dans d'autres endroits où l'infrastructure ou les prestataires de services opèrent. Le traitement transfrontalier est soumis à la loi applicable et aux garanties appropriées au service. Contactez-nous si vous avez besoin de détails sur un transfert spécifique."
          ]
        },
        {
          "bullets": [],
          "heading": "7. Conservation et suppression",
          "paragraphs": [
            "Nous conservons les informations aussi longtemps que nécessaire pour fournir les services, administrer les accords, tenir les registres financiers et commerciaux, protéger la sécurité du compte, résoudre les litiges et respecter les exigences légales, comptables ou réglementaires. Les périodes de conservation dépendent du registre et de l'obligation applicable.",
            "Vous pouvez demander l'accès, la rectification ou la suppression via les contrôles de données intégrés à l'application ou sur https://www.ogexports.co/delete-account. Le Support vérifiera la propriété du compte et examinera les investissements actifs ainsi que les devoirs de conservation. Les données personnelles éligibles seront supprimées ou anonymisées ; les registres qui doivent rester peuvent être conservés avec un accès limité à des fins appropriées. Une demande ne ferme pas immédiatement un compte et n'efface pas immédiatement les registres."
          ]
        },
        {
          "bullets": [],
          "heading": "8. Sécurité et cookies",
          "paragraphs": [
            "Nous utilisons des contrôles d'accès et des garanties techniques et organisationnelles destinées à protéger les informations. Aucun système de transmission ou de stockage sur Internet ne peut être garanti comme étant totalement sécurisé. Gardez vos identifiants privés et informez rapidement le Support en cas de suspicion de compromission de compte.",
            "Le site web peut utiliser des cookies essentiels ou des technologies similaires pour les sessions, la sécurité et les préférences. Les désactiver peut affecter la connexion ou d'autres fonctionnalités. Toute technologie d'analyse facultative ou similaire, lorsqu'elle est activée, est soumise aux paramètres et à la loi applicables."
          ]
        },
        {
          "bullets": [],
          "heading": "9. Enfants et droits individuels",
          "paragraphs": [
            "Les services sont destinés aux personnes légalement capables de conclure l'accord pertinent et ne sont pas conçus pour les enfants. Nous ne cherchons pas sciemment à obtenir des informations personnelles auprès d'enfants. Si vous pensez qu'un enfant a fourni des informations, contactez le Support.",
            "Selon la loi applicable, vous pouvez demander l'accès, la rectification, la suppression, une copie des données disponibles ou des modifications aux communications facultatives. Nous pouvons avoir besoin de vérifier votre identité et pouvons conserver les registres requis pour des raisons légales ou contractuelles."
          ]
        },
        {
          "bullets": [],
          "heading": "10. Mises à jour et contact vie privée",
          "paragraphs": [
            "Nous pouvons mettre à jour cette Politique et publier une date révisée. Les changements importants seront communiqués lorsque la loi l'exige.",
            "Demandes de confidentialité et de données : OG Exports (Private) Limited, info@ogexports.co, https://www.ogexports.co. Les demandes de suppression de compte peuvent également être effectuées sur https://www.ogexports.co/delete-account."
          ]
        }
      ],
      "reviewStatus": "pending"
    },
    "es": {
      "title": "Política de Privacidad",
      "summary": "OG Exports (Private) Limited · Efectiva desde su publicación. Esta Política explica cómo se maneja la información cuando utiliza los servicios digitales de OG Exports.",
      "sections": [
        {
          "bullets": [],
          "heading": "1. Quiénes somos y alcance",
          "paragraphs": [
            "OG Exports (Private) Limited opera servicios de exportación agrícola, comercio e inversores desde Pakistán. Esta Política se aplica a nuestro sitio web, aplicación para inversores, cuentas, comunicaciones de soporte y servicios digitales relacionados. Debe leerse junto con el Acuerdo de Usuario y los términos específicos de una transacción."
          ]
        },
        {
          "bullets": [
            "Detalles de cuenta y contacto: nombre, correo electrónico, número de móvil opcional, país, detalles del perfil y comunicaciones.",
            "Detalles de verificación: identidad, dirección o documentos comerciales y estado de revisión relacionado cuando se soliciten para un servicio aplicable.",
            "Registros financieros y comerciales: referencias bancarias/de pago, solicitudes de depósito y retiro, participación en inversiones, identificadores de transacciones, registros de billetera y moneda, acuerdos firmados, documentos de proyectos e información de envío/pedido.",
            "Datos de soporte y preferencias: mensajes, solicitudes de derechos de datos, opciones de notificación, idioma y configuración de visualización.",
            "Datos técnicos y de seguridad: dispositivo, navegador, información de IP/sesión, eventos de inicio de sesión y auditoría, y registros de error o uso generados por la Plataforma."
          ],
          "heading": "2. Información que podemos recopilar",
          "paragraphs": []
        },
        {
          "bullets": [
            "Crear y asegurar cuentas; autenticar usuarios; proporcionar soporte y mantener las preferencias solicitadas.",
            "Revisar la elegibilidad de identidad o comercial cuando corresponda, administrar oportunidades y acuerdos, y mantener registros precisos de comercio, pago e inversores.",
            "Mostrar la actividad de la cuenta, comunicar cambios en el estado verificado, enviar avisos solicitados e investigar errores o sospechas de mal uso.",
            "Proteger la Plataforma, cumplir con obligaciones contractuales y legales, responder a solicitudes legales, resolver disputas y mantener los registros comerciales requeridos."
          ],
          "heading": "3. Cómo usamos la información",
          "paragraphs": []
        },
        {
          "bullets": [],
          "heading": "4. Base legal y operativa",
          "paragraphs": [
            "Dependiendo del servicio y la ley aplicable, procesamos información para proporcionar un servicio solicitado, ejecutar o administrar un acuerdo, proteger a los usuarios y a la Plataforma, cumplir con obligaciones legales o perseguir intereses operativos legítimos. Cuando se requiera consentimiento, lo solicitaremos y usted podrá retirarlo sujeto a límites legales y contractuales."
          ]
        },
        {
          "bullets": [],
          "heading": "5. Compartición y proveedores de servicios",
          "paragraphs": [
            "No vendemos información personal. Solo podemos divulgar la información razonablemente necesaria al personal autorizado, bancos y canales de pago involucrados en su transacción, proveedores de servicios que apoyan el alojamiento, autenticación, correo electrónico o notificaciones, asesores profesionales, reguladores o cuerpos de cumplimiento de la ley donde sea legalmente requerido, y partes necesarias para proteger derechos o investigar fraudes. Los correos electrónicos de autenticación del inversor pueden ser entregados utilizando Resend; las notificaciones push pueden usar Expo cuando estén habilitadas para su dispositivo. Los proveedores de correo electrónico de soporte, alojamiento, almacenamiento y pago dependen del servicio y la configuración utilizada por OG Exports. Los proveedores deben procesar la información para el propósito de su servicio y bajo las salvaguardas aplicables.",
            "No publicamos sus registros privados de inversión o identidad. Una transacción específica puede requerir compartir detalles relevantes con contrapartes, instituciones financieras o autoridades; el acuerdo aplicable y la ley rigen dicha divulgación."
          ]
        },
        {
          "bullets": [],
          "heading": "6. Procesamiento internacional",
          "paragraphs": [
            "Usted puede acceder a la Plataforma desde fuera de Pakistán. La información puede ser manejada en Pakistán y en otras ubicaciones donde operan los proveedores de infraestructura o servicios. El manejo transfronterizo está sujeto a la ley aplicable y a salvaguardas apropiadas para el servicio. Contáctenos si necesita detalles sobre una transferencia específica."
          ]
        },
        {
          "bullets": [],
          "heading": "7. Retención y eliminación",
          "paragraphs": [
            "Retenemos información durante el tiempo necesario para proporcionar servicios, administrar acuerdos, mantener registros financieros y comerciales, proteger la seguridad de la cuenta, resolver disputas y cumplir con requisitos legales, contables o regulatorios. Los periodos de retención dependen del registro y la obligación aplicable.",
            "Usted puede solicitar acceso, corrección o eliminación a través de los controles de datos dentro de la aplicación o https://www.ogexports.co/delete-account. El Soporte verificará la propiedad de la cuenta y revisará las inversiones activas y las obligaciones de retención. Los datos personales elegibles serán eliminados o anonimizados; los registros que deban permanecer podrán conservarse con el acceso limitado a los fines apropiados. Una solicitud no cierra inmediatamente una cuenta ni borra registros."
          ]
        },
        {
          "bullets": [],
          "heading": "8. Seguridad y cookies",
          "paragraphs": [
            "Utilizamos controles de acceso y salvaguardas técnicas y organizativas destinadas a proteger la información. Ningún sistema de transmisión o almacenamiento en internet puede garantizarse completamente seguro. Mantenga las credenciales privadas e informe al Soporte de inmediato sobre una posible vulneración de la cuenta.",
            "El sitio web puede utilizar cookies esenciales o tecnologías similares para sesiones, seguridad y preferencias. Deshabilitarlas puede afectar el inicio de sesión u otras funciones. Cualquier tecnología de análisis opcional o similar, donde esté habilitada, está sujeta a la configuración y ley aplicables."
          ]
        },
        {
          "bullets": [],
          "heading": "9. Niños y derechos individuales",
          "paragraphs": [
            "Los servicios están destinados a personas legalmente capaces de celebrar el acuerdo correspondiente y no están diseñados para niños. No buscamos conscientemente información personal de niños. Si cree que un niño proporcionó información, contacte al Soporte.",
            "Dependiendo de la ley aplicable, usted puede solicitar acceso, corrección, eliminación, una copia de los datos disponibles o cambios en las comunicaciones opcionales. Es posible que necesitemos verificar su identidad y podamos retener los registros requeridos por razones legales o contractuales."
          ]
        },
        {
          "bullets": [],
          "heading": "10. Actualizaciones y contacto de privacidad",
          "paragraphs": [
            "Podemos actualizar esta Política y publicar una fecha revisada. Los cambios materiales se comunicarán donde la ley lo requiera.",
            "Solicitudes de privacidad y datos: OG Exports (Private) Limited, info@ogexports.co, https://www.ogexports.co. Las solicitudes de eliminación de cuenta también pueden realizarse en https://www.ogexports.co/delete-account."
          ]
        }
      ],
      "reviewStatus": "pending"
    },
    "de": {
      "title": "Datenschutzrichtlinie",
      "summary": "OG Exports (Private) Limited · Wirksam bei Veröffentlichung. Diese Richtlinie erläutert, wie Informationen behandelt werden, wenn Sie die digitalen Dienste von OG Exports nutzen.",
      "sections": [
        {
          "bullets": [],
          "heading": "1. Wer wir sind und Anwendungsbereich",
          "paragraphs": [
            "OG Exports (Private) Limited betreibt landwirtschaftliche Export-, Handels- und Investorendienste von Pakistan aus. Diese Richtlinie gilt für unsere Website, die Investoren-App, Konten, Support-Kommunikation und damit verbundene digitale Dienste. Sie ist zusammen mit der Nutzungsvereinbarung und den spezifischen Bedingungen für eine Transaktion zu lesen."
          ]
        },
        {
          "bullets": [
            "Konto- und Kontaktdaten: Name, E-Mail-Adresse, optionale Mobilnummer, Land, Profildetails und Kommunikation.",
            "Verifizierungsdetails: Identitäts-, Adress- oder Geschäftsdokumente und zugehöriger Überprüfungsstatus, wenn dies für einen anwendbaren Dienst angefordert wird.",
            "Finanz- und Handelsaufzeichnungen: Bank-/Zahlungsreferenzen, Ein- und Auszahlungsanfragen, Investitionsbeteiligungen, Transaktionskennungen, Wallet- und Währungsaufzeichnungen, unterzeichnete Verträge, Projektunterlagen und Versand-/Auftragsinformationen.",
            "Support- und Einstellungsdaten: Nachrichten, Anfragen zu Datenrechten, Benachrichtigungswahlen, Sprach- und Anzeigeeinstellungen.",
            "Technische Daten und Sicherheitsdaten: Gerät, Browser, IP-/Sitzungsinformationen, Anmelde- und Protokollereignisse sowie vom System generierte Fehler- oder Nutzungsaufzeichnungen."
          ],
          "heading": "2. Informationen, die wir sammeln können",
          "paragraphs": []
        },
        {
          "bullets": [
            "Konten erstellen und sichern; Benutzer authentifizieren; Support leisten und angeforderte Einstellungen beibehalten.",
            "Identitäts- oder Geschäftsberechtigung prüfen, sofern anwendbar, Gelegenheiten und Verträge verwalten sowie genaue Handels-, Zahlungs- und Investorenunterlagen führen.",
            "Kontoaktivitäten anzeigen, Änderungen des Verifizierungsstatus kommunizieren, angeforderte Mitteilungen übermitteln und Fehler oder vermuteten Missbrauch untersuchen.",
            "Die Plattform schützen, vertragliche und gesetzliche Verpflichtungen erfüllen, auf rechtmäßige Anfragen reagieren, Streitigkeiten beilegen und erforderliche Geschäftsunterlagen führen."
          ],
          "heading": "3. Wie wir Informationen verwenden",
          "paragraphs": []
        },
        {
          "bullets": [],
          "heading": "4. Rechtliche und operative Grundlage",
          "paragraphs": [
            "Abhängig vom Dienst und dem anwendbaren Recht verarbeiten wir Informationen, um einen angeforderten Dienst bereitzustellen, einen Vertrag zu erfüllen oder zu verwalten, Benutzer und die Plattform zu schützen, gesetzliche Verpflichtungen zu erfüllen oder legitime operative Interessen zu verfolgen. Wo eine Zustimmung erforderlich ist, werden wir diese anfordern und Sie können sie vorbehaltlich gesetzlicher und vertraglicher Grenzen widerrufen."
          ]
        },
        {
          "bullets": [],
          "heading": "5. Weitergabe und Dienstleister",
          "paragraphs": [
            "Wir verkaufen keine personenbezogenen Daten. Wir können Informationen nur in dem für Ihre Transaktion vernünftigerweise erforderlichen Umfang an autorisierte Mitarbeiter, Banken und Zahlungskanäle offenlegen, sowie an Dienstleister, die Hosting, Authentifizierung, E-Mail oder Benachrichtigungen unterstützen, an professionelle Berater, Regulierungsbehörden oder Strafverfolgungsbehörden, wenn dies gesetzlich vorgeschrieben ist, und an Parteien, die zum Schutz von Rechten oder zur Untersuchung von Betrug erforderlich sind. E-Mails zur Investorenauthentifizierung können über Resend versandt werden; Push-Benachrichtigungen können Expo verwenden, wenn sie auf Ihrem Gerät aktiviert sind. Anbieter für Support-E-Mails, Hosting, Speicherung und Zahlungen hängen von dem Dienst und der von OG Exports (Private) Limited verwendeten Konfiguration ab. Anbieter sollten Informationen für ihre Dienstleistungszwecke und unter Einhaltung anwendbarer Schutzmaßnahmen verarbeiten.",
            "Wir veröffentlichen keine privaten Investitions- oder Identitätsdaten. Eine spezifische Transaktion kann die Weitergabe relevanter Details an Gegenparteien, Finanzinstitute oder Behörden erfordern; der anwendbare Vertrag und das Recht regeln diese Offenlegung."
          ]
        },
        {
          "bullets": [],
          "heading": "6. Internationale Verarbeitung",
          "paragraphs": [
            "Sie können von außerhalb Pakistans auf die Plattform zugreifen. Informationen können in Pakistan und an anderen Orten verarbeitet werden, an denen Infrastruktur oder Dienstleister tätig sind. Die grenzüberschreitende Handhabung unterliegt dem anwendbaren Recht und Schutzmaßnahmen, die für den Dienst angemessen sind. Kontaktieren Sie uns, wenn Sie Einzelheiten zu einer spezifischen Übermittlung benötigen."
          ]
        },
        {
          "bullets": [],
          "heading": "7. Aufbewahrung und Löschung",
          "paragraphs": [
            "Wir speichern Informationen so lange, wie es für die Bereitstellung von Diensten, die Verwaltung von Verträgen, die Führung von Finanz- und Handelsunterlagen, den Schutz der Kontosicherheit, die Beilegung von Streitigkeiten und die Erfüllung gesetzlicher, buchhalterischer oder regulatorischer Anforderungen erforderlich ist. Aufbewahrungsfristen hängen von der Aufzeichnung und der anwendbaren Verpflichtung ab.",
            "Sie können den Zugriff, die Korrektur oder die Löschung über die In-App-Datenkontrollen oder https://www.ogexports.co/delete-account anfordern. Der Support überprüft die Kontoinhaberschaft sowie aktive Investitionen und Aufbewahrungspflichten. Anspruchsberechtigte personenbezogene Daten werden gelöscht oder anonymisiert; Datensätze, die verbleiben müssen, können mit auf angemessene Zwecke beschränktem Zugriff aufbewahrt werden. Eine Anfrage schließt für sich genommen nicht sofort ein Konto oder löscht Datensätze."
          ]
        },
        {
          "bullets": [],
          "heading": "8. Sicherheit und Cookies",
          "paragraphs": [
            "Wir verwenden Zugangskontrollen sowie technische und organisatorische Schutzmaßnahmen zum Schutz von Informationen. Kein Internetübertragungs- oder Speichersystem kann als vollständig sicher garantiert werden. Halten Sie Anmeldedaten geheim und informieren Sie den Support umgehend bei Verdacht auf Kontokompromittierung.",
            "Die Website kann essenzielle Cookies oder ähnliche Technologien für Sitzungen, Sicherheit und Einstellungen verwenden. Deren Deaktivierung kann die Anmeldung oder andere Funktionen beeinträchtigen. Optionale Analysen oder ähnliche Technologien unterliegen, sofern aktiviert, den jeweils anwendbaren Einstellungen und Gesetzen."
          ]
        },
        {
          "bullets": [],
          "heading": "9. Kinder und individuelle Rechte",
          "paragraphs": [
            "Die Dienste sind für Personen bestimmt, die rechtlich in der Lage sind, den entsprechenden Vertrag einzugehen, und sind nicht für Kinder konzipiert. Wir suchen nicht wissentlich nach personenbezogenen Daten von Kindern. Wenn Sie glauben, dass ein Kind Informationen bereitgestellt hat, kontaktieren Sie den Support.",
            "Je nach anwendbarem Recht können Sie Zugriff, Korrektur, Löschung, eine Kopie der verfügbaren Daten oder Änderungen an optionalen Mitteilungen anfordern. Wir müssen möglicherweise Ihre Identität überprüfen und können Datensätze aufbewahren, die aus rechtlichen oder vertraglichen Gründen erforderlich sind."
          ]
        },
        {
          "bullets": [],
          "heading": "10. Updates und Datenschutz-Kontakt",
          "paragraphs": [
            "Wir können diese Richtlinie aktualisieren und ein geändertes Datum veröffentlichen. Wesentliche Änderungen werden kommuniziert, wo dies gesetzlich vorgeschrieben ist.",
            "Datenschutz- und Datenanfragen: OG Exports (Private) Limited, info@ogexports.co, https://www.ogexports.co. Anträge auf Kontolöschung können auch unter https://www.ogexports.co/delete-account gestellt werden."
          ]
        }
      ],
      "reviewStatus": "pending"
    }
  },
  "risk": {
    "ru": {
      "title": "Раскрытие рисков",
      "summary": "Прочитайте это раскрытие вместе с деталями предложения и подписанным Инвестиционным соглашением перед тем, как инвестировать.",
      "sections": [
        {
          "bullets": [],
          "heading": "1. Капитал находится под риском",
          "paragraphs": [
            "Инвестиция может быть задержана, может принести меньше ожидаемого или привести к частичной или полной потере капитала. OG Exports (Private) Limited не обещает доходность, дату погашения или возврат основной суммы, если только подписанное соглашение прямо не создает конкретное обязательство. Не инвестируйте деньги, которые вы не можете позволить себе потерять."
          ]
        },
        {
          "bullets": [],
          "heading": "2. Торговый и товарный риск",
          "paragraphs": [
            "Коммерческие результаты могут меняться из-за цен на товары, доступности поставок, результатов качества или инспекции, погоды, состояния урожая, спроса покупателей, выполнения контрактов, потребностей в оборотном капитале, операционных затрат и рыночной конкуренции. Прогнозируемая маржа или цель является оценкой, а не гарантированным результатом.",
            "OG Exports (Private) Limited организует страхование для каждой экспортно-импортной сделки. Страхование может снизить подверженность покрываемым убыткам, но не устраняет риск и не гарантирует полную компенсацию. Покрытие зависит от применимого полиса, страховой стоимости, лимитов, исключений, франшиз, соблюдения условий полиса, требований к уведомлению и доказательствам, а также оценки страховщика. Убытки вне покрытия или сверх его лимитов могут остаться невозмещенными."
          ]
        },
        {
          "bullets": [],
          "heading": "3. Контрагент, логистика и форс-мажор",
          "paragraphs": [
            "Поставщик, покупатель, перевозчик, банк, страховщик или другой контрагент может не выполнить обязательства, оспорить выполнение, задержать оплату или стать неплатежеспособным. Заторы в портах, смена судов, таможня, экспортно-импортный контроль, документация, исключения по страхованию, трудовые споры, погода, конфликты, события в области общественного здравоохранения или другие события вне разумного контроля могут задержать, увеличить затраты или предотвратить торговлю."
          ]
        },
        {
          "bullets": [],
          "heading": "4. Валюта, расчеты и ликвидность",
          "paragraphs": [
            "Валюты инвестирования, кошелька, платежа и расчетов могут различаться. Изменения обменного курса, банковские комиссии, ограничения на перевод или сроки конвертации могут снизить полученную стоимость. Запись транзакции и соответствующее соглашение определяют применимую валюту и любой зарегистрированный курс конвертации.",
            "Инвестиция может быть не подлежащей передаче или не подлежащей выкупу по требованию. Вторичного рынка может не существовать. Запросы на вывод средств подлежат применимым условиям кошелька, верификации и доступным каналам обработки; расчетное время обработки не является гарантированной датой завершения."
          ]
        },
        {
          "bullets": [],
          "heading": "5. Операционный, правовой и технологический риск",
          "paragraphs": [
            "Бизнес-операции, документация, люди, системы, кибербезопасность, правовые или регуляторные изменения и налогообложение могут повлиять на проект. Платформа может быть недоступна или отображать информацию, которая позже требует исправления. Подтверждайте важные условия на основании подписанного соглашения и официальных записей транзакций."
          ]
        },
        {
          "bullets": [],
          "heading": "6. Оценки и прошлые результаты",
          "paragraphs": [
            "Прогнозы, целевые даты, ход финансирования, примеры расчетов и исторические результаты не являются обещаниями будущей эффективности. Прошлые результаты, если они показаны, не гарантируют будущие исходы. Фактические результаты могут существенно отличаться от оценок."
          ]
        },
        {
          "bullets": [],
          "heading": "7. Независимая оценка",
          "paragraphs": [
            "Платформа предоставляет информацию, а не персональные финансовые, юридические, бухгалтерские или налоговые консультации. Оценивайте риски, читайте все документы по проекту и получите независимую профессиональную консультацию, соответствующую вашим обстоятельствам. Попросите службу поддержки прояснить недостающую или противоречивую информацию в предложении перед продолжением."
          ]
        },
        {
          "bullets": [],
          "heading": "8. Подтверждение",
          "paragraphs": [
            "Отдельно подтверждая это раскрытие и подавая инвестиционный запрос, вы подтверждаете, что у вас была возможность ознакомиться с этими рисками. Подтверждение не лишает прав, которые не могут быть законно исключены, и не гарантирует, что запрос будет принят."
          ]
        }
      ],
      "reviewStatus": "pending"
    },
    "zh-CN": {
      "title": "风险披露",
      "summary": "在投资前请阅读此披露信息，并结合要约详情和已签署的《投资协议》一并参考。",
      "sections": [
        {
          "bullets": [],
          "heading": "1. 资本面临风险",
          "paragraphs": [
            "投资可能会被延迟、回报可能低于预期，或可能导致部分或全部资本损失。除非签署的协议明确设定了具体义务，否则 OG Exports (Private) Limited 不承诺回报、还款日期或本金追回。请勿投入您无法承受损失的资金。"
          ]
        },
        {
          "bullets": [],
          "heading": "2. 贸易与商品风险",
          "paragraphs": [
            "商业结果可能会因商品价格、供应情况、质量或检验结果、天气、作物条件、买家需求、合同履行、营运资金需求、运营成本和市场竞争而改变。预测的利润率或目标仅为估算值，而非保证结果。",
            "OG Exports (Private) Limited 为每一笔进出口贸易安排保险。保险可以减少对承保损失的敞口，但不能消除风险或保证全额赔偿。覆盖范围取决于适用保单、保险价值、限额、除外责任、免赔额、对保单条件的遵守、通知和证据要求，以及保险公司的评估。保单覆盖范围之外或超过限额的损失可能无法追回。"
          ]
        },
        {
          "bullets": [],
          "heading": "3. 交易对手、物流与不可抗力",
          "paragraphs": [
            "供应商、买家、承运人、银行、保险公司或其他交易对手可能会违约、对履行产生争议、延迟付款或陷入无力偿债状态。港口拥堵、船只变更、海关、进出口管制、文件处理、保险除外责任、劳工纠纷、天气、冲突、公共卫生事件或其他超出合理控制范围的事件可能导致贸易延迟、成本增加或无法进行。"
          ]
        },
        {
          "bullets": [],
          "heading": "4. 货币、结算与流动性",
          "paragraphs": [
            "投资、钱包、付款和结算货币可能不同。汇率变动、银行费用、转账限制或转换时间可能会降低收到的价值。交易记录和相关协议决定了适用货币及任何已记录的转换汇率。",
            "投资可能无法转让或随时赎回。可能不存在二级市场。取款请求须遵守适用的钱包条款、验证和可用的处理渠道；预估处理时间并非保证完成日期。"
          ]
        },
        {
          "bullets": [],
          "heading": "5. 运营、法律与技术风险",
          "paragraphs": [
            "商业运营、文件记录、人员、系统、网络安全、法律或监管变更以及税务处理可能会影响项目。平台可能无法访问或显示随后需要更正的信息。请根据已签署的协议和官方交易记录确认重要条款。"
          ]
        },
        {
          "bullets": [],
          "heading": "6. 估算与过往业绩",
          "paragraphs": [
            "预测、目标日期、融资进度、样本计算和历史结果并非对未来业绩的承诺。过往业绩（如有显示）不能可靠地预测未来结果。实际结果可能与估算值存在实质性差异。"
          ]
        },
        {
          "bullets": [],
          "heading": "7. 独立评估",
          "paragraphs": [
            "本平台提供信息，而非个人财务、法律、会计或税务建议。请评估风险、阅读所有项目文件并获取适合您情况的独立专业建议。在进行操作前，请联系支持团队澄清缺失或不一致的要约信息。"
          ]
        },
        {
          "bullets": [],
          "heading": "8. 确认",
          "paragraphs": [
            "通过单独确认本披露信息并提交投资请求，即确认您已有机会审查这些风险。确认并不放弃依法不能放弃的权利，也不保证请求会被接受。"
          ]
        }
      ],
      "reviewStatus": "pending"
    },
    "fr": {
      "title": "Divulgation des risques",
      "summary": "Lisez cette divulgation conjointement avec les détails de l'offre et le Contrat d'investissement signé avant d'investir.",
      "sections": [
        {
          "bullets": [],
          "heading": "1. Le capital est à risque",
          "paragraphs": [
            "Un investissement peut être retardé, peut produire moins que prévu ou peut entraîner une perte partielle ou totale du capital. OG Exports (Private) Limited ne promet pas de rendement, de date de remboursement ou de recouvrement du principal, sauf si un accord exécuté crée expressément une obligation spécifique. N'investissez pas d'argent que vous ne pouvez pas vous permettre de perdre."
          ]
        },
        {
          "bullets": [],
          "heading": "2. Risque lié au négoce et aux marchandises",
          "paragraphs": [
            "Les résultats commerciaux peuvent changer en raison des prix des matières premières, de la disponibilité de l'offre, des résultats de qualité ou d'inspection, de la météo, des conditions des récoltes, de la demande des acheteurs, de l'exécution des contrats, des besoins en fonds de roulement, des coûts d'exploitation et de la concurrence sur le marché. Une marge ou une cible projetée est une estimation, pas un résultat garanti.",
            "OG Exports (Private) Limited organise une assurance pour chaque négoce d'import-export. L'assurance peut réduire l'exposition aux pertes couvertes, mais elle n'élimine pas le risque et ne garantit pas une indemnisation intégrale. La couverture dépend de la police applicable, de la valeur assurée, des limites, des exclusions, des franchises, du respect des conditions de la police, des exigences de notification et de preuve, et de l'évaluation de l'assureur. Les pertes hors couverture ou supérieures à ses limites peuvent rester non recouvrées."
          ]
        },
        {
          "bullets": [],
          "heading": "3. Contrepartie, logistique et force majeure",
          "paragraphs": [
            "Un fournisseur, acheteur, transporteur, banque, assureur ou autre contrepartie peut faire défaut, contester l'exécution, retarder le paiement ou devenir insolvable. La congestion portuaire, les changements de navires, les douanes, les contrôles à l'exportation/importation, la documentation, les exclusions d'assurance, les conflits sociaux, la météo, les conflits, les événements de santé publique ou d'autres événements hors de contrôle raisonnable peuvent retarder, augmenter les coûts ou empêcher un négoce."
          ]
        },
        {
          "bullets": [],
          "heading": "4. Devise, règlement et liquidité",
          "paragraphs": [
            "Les devises d'investissement, de portefeuille, de paiement et de règlement peuvent différer. Les variations des taux de change, les frais bancaires, les restrictions de transfert ou le calendrier de conversion peuvent réduire la valeur reçue. Le registre de transaction et l'accord pertinent déterminent la devise applicable et tout taux de conversion enregistré.",
            "Un investissement peut ne pas être transférable ou remboursable à la demande. Il peut ne pas exister de marché secondaire. Les demandes de retrait sont soumises aux conditions de portefeuille applicables, à la vérification et aux canaux de traitement disponibles ; un délai de traitement estimé n'est pas une date de fin garantie."
          ]
        },
        {
          "bullets": [],
          "heading": "5. Risque opérationnel, juridique et technologique",
          "paragraphs": [
            "Les opérations commerciales, la documentation, les personnes, les systèmes, la cybersécurité, les changements juridiques ou réglementaires et le traitement fiscal peuvent affecter un projet. La Plateforme peut être indisponible ou afficher des informations nécessitant ultérieurement une correction. Confirmez les termes importants par rapport à l'accord exécuté et aux registres de transaction officiels."
          ]
        },
        {
          "bullets": [],
          "heading": "6. Estimations et résultats passés",
          "paragraphs": [
            "Les prévisions, dates cibles, avancement du financement, exemples de calculs et résultats historiques ne sont pas des promesses de performance future. Les résultats passés, s'ils sont affichés, ne prédisent pas de manière fiable les résultats futurs. Les résultats réels peuvent différer sensiblement des estimations."
          ]
        },
        {
          "bullets": [],
          "heading": "7. Évaluation indépendante",
          "paragraphs": [
            "La Plateforme fournit des informations, pas des conseils financiers, juridiques, comptables ou fiscaux personnalisés. Évaluez les risques, lisez tous les documents du projet et obtenez des conseils professionnels indépendants adaptés à votre situation. Demandez au Support de clarifier les informations d'offre manquantes ou incohérentes avant de procéder."
          ]
        },
        {
          "bullets": [],
          "heading": "8. Reconnaissance",
          "paragraphs": [
            "En reconnaissant séparément cette divulgation et en soumettant une demande d'investissement, vous confirmez que vous avez eu l'opportunité d'examiner ces risques. La reconnaissance ne renonce pas aux droits auxquels il ne peut légalement être renoncé et ne garantit pas qu'une demande sera acceptée."
          ]
        }
      ],
      "reviewStatus": "pending"
    },
    "es": {
      "title": "Divulgación de Riesgos",
      "summary": "Lea esta divulgación junto con los detalles de la oferta y el Acuerdo de Inversión firmado antes de invertir.",
      "sections": [
        {
          "bullets": [],
          "heading": "1. El capital está en riesgo",
          "paragraphs": [
            "Una inversión puede retrasarse, puede producir menos de lo esperado o puede resultar en una pérdida parcial o total del capital. OG Exports no promete un rendimiento, fecha de pago o recuperación del principal a menos que un acuerdo ejecutado cree expresamente una obligación específica. No invierta dinero que no pueda permitirse perder."
          ]
        },
        {
          "bullets": [],
          "heading": "2. Riesgo comercial y de productos básicos",
          "paragraphs": [
            "Los resultados comerciales pueden cambiar debido a los precios de los productos básicos, la disponibilidad de suministro, los resultados de calidad o inspección, el clima, las condiciones de los cultivos, la demanda del comprador, el desempeño del contrato, las necesidades de capital de trabajo, los costos operativos y la competencia del mercado. Un margen o objetivo proyectado es una estimación, no un resultado garantizado.",
            "OG Exports contrata seguros para cada operación de exportación e importación. El seguro puede reducir la exposición a pérdidas cubiertas, pero no elimina el riesgo ni garantiza una compensación completa. La cobertura depende de la póliza aplicable, el valor asegurado, los límites, las exclusiones, los deducibles, el cumplimiento de las condiciones de la póliza, los requisitos de notificación y evidencia, y la evaluación del asegurador. Las pérdidas fuera de la cobertura o por encima de sus límites pueden permanecer sin recuperar."
          ]
        },
        {
          "bullets": [],
          "heading": "3. Riesgo de contraparte, logística y fuerza mayor",
          "paragraphs": [
            "Un proveedor, comprador, transportista, banco, asegurador u otra contraparte puede fallar, disputar el desempeño, retrasar el pago o volverse insolvente. La congestión portuaria, cambios de buque, aduanas, controles de exportación/importación, documentación, exclusiones de seguros, disrupción laboral, clima, conflicto, eventos de salud pública u otros eventos fuera de control razonable pueden retrasar, aumentar costos o impedir un comercio."
          ]
        },
        {
          "bullets": [],
          "heading": "4. Moneda, liquidación y liquidez",
          "paragraphs": [
            "Las monedas de inversión, billetera, pago y liquidación pueden diferir. Los cambios en la tasa de cambio, cargos bancarios, restricciones de transferencia o el momento de la conversión pueden reducir el valor recibido. El registro de la transacción y el acuerdo relevante determinan la moneda aplicable y cualquier tasa de conversión registrada.",
            "Una inversión puede no ser transferible o reembolsable bajo demanda. Puede no existir un mercado secundario. Las solicitudes de retiro están sujetas a los términos de la billetera aplicables, la verificación y los canales de procesamiento disponibles; un tiempo de procesamiento estimado no es una fecha de finalización garantizada."
          ]
        },
        {
          "bullets": [],
          "heading": "5. Riesgo operativo, legal y tecnológico",
          "paragraphs": [
            "Las operaciones comerciales, documentación, personas, sistemas, ciberseguridad, cambios legales o regulatorios y el tratamiento fiscal pueden afectar un proyecto. La Plataforma puede no estar disponible o mostrar información que requiera corrección posterior. Confirme los términos importantes contra el acuerdo ejecutado y los registros oficiales de la transacción."
          ]
        },
        {
          "bullets": [],
          "heading": "6. Estimaciones y resultados pasados",
          "paragraphs": [
            "Los pronósticos, fechas objetivo, progreso de financiación, cálculos de muestra y resultados históricos no son promesas de rendimiento futuro. Los resultados pasados, si se muestran, no predicen de manera confiable los resultados futuros. Los resultados reales pueden diferir materialmente de las estimaciones."
          ]
        },
        {
          "bullets": [],
          "heading": "7. Evaluación independiente",
          "paragraphs": [
            "La Plataforma proporciona información, no asesoramiento personal financiero, legal, contable o fiscal. Evalúe los riesgos, lea todos los documentos del proyecto y obtenga asesoramiento profesional independiente apropiado para sus circunstancias. Pida al Soporte que aclare la información faltante o inconsistente de la oferta antes de proceder."
          ]
        },
        {
          "bullets": [],
          "heading": "8. Reconocimiento",
          "paragraphs": [
            "Al reconocer por separado esta divulgación y enviar una solicitud de inversión, usted confirma que ha tenido la oportunidad de revisar estos riesgos. El reconocimiento no renuncia a derechos que no pueden ser legalmente renunciados y no garantiza que una solicitud será aceptada."
          ]
        }
      ],
      "reviewStatus": "pending"
    },
    "de": {
      "title": "Risikohinweis-Erklärung",
      "summary": "Lesen Sie diesen Hinweis zusammen mit den Angebotsdetails und dem unterzeichneten Investitionsvertrag, bevor Sie investieren.",
      "sections": [
        {
          "bullets": [],
          "heading": "1. Kapital ist gefährdet",
          "paragraphs": [
            "Eine Investition kann verzögert werden, weniger als erwartet einbringen oder zu einem teilweisen oder vollständigen Kapitalverlust führen. OG Exports (Private) Limited verspricht keine Rendite, kein Rückzahlungsdatum und keine Rückgewinnung des Kapitals, es sei denn, ein unterzeichneter Vertrag schafft ausdrücklich eine spezifische Verpflichtung. Investieren Sie kein Geld, dessen Verlust Sie sich nicht leisten können."
          ]
        },
        {
          "bullets": [],
          "heading": "2. Handels- und Warenrisiko",
          "paragraphs": [
            "Wirtschaftliche Ergebnisse können sich aufgrund von Warenpreisen, Versorgungsangebot, Qualitäts- oder Inspektionsergebnissen, Wetter, Erntebedingungen, Käufernachfrage, Vertragserfüllung, Betriebsmittelbedarf, Betriebskosten und Marktwettbewerb ändern. Eine prognostizierte Marge oder ein Ziel ist eine Schätzung, kein garantiertes Ergebnis.",
            "OG Exports (Private) Limited schließt Versicherungen für jeden Export- und Importgeschäft ab. Versicherungen können die Exposition gegenüber gedeckten Verlusten verringern, eliminieren jedoch nicht das Risiko und garantieren keine vollständige Entschädigung. Der Versicherungsschutz hängt von der anwendbaren Police, dem versicherten Wert, Grenzen, Ausschlüssen, Selbstbehalten, der Einhaltung von Versicherungsbedingungen, Mitteilungs- und Nachweispflichten sowie der Einschätzung des Versicherers ab. Verluste außerhalb der Deckung oder über deren Grenzen hinaus können ungedeckt bleiben."
          ]
        },
        {
          "bullets": [],
          "heading": "3. Gegenpartei, Logistik und höhere Gewalt",
          "paragraphs": [
            "Ein Lieferant, Käufer, Spediteur, eine Bank, ein Versicherer oder eine andere Gegenpartei kann ausfallen, die Leistung bestreiten, die Zahlung verzögern oder zahlungsunfähig werden. Hafenüberlastungen, Schiffswechsel, Zoll, Export-/Importkontrollen, Dokumentation, Versicherungsausschlüsse, Arbeitskämpfe, Wetter, Konflikte, Ereignisse der öffentlichen Gesundheit oder andere Ereignisse außerhalb der zumutbaren Kontrolle können einen Handel verzögern, die Kosten erhöhen oder verhindern."
          ]
        },
        {
          "bullets": [],
          "heading": "4. Währung, Abwicklung und Liquidität",
          "paragraphs": [
            "Investitions-, Wallet-, Zahlungs- und Abwicklungswährungen können abweichen. Wechselkursänderungen, Bankgebühren, Übertragungsbeschränkungen oder der Zeitpunkt der Umrechnung können den erhaltenen Wert verringern. Der Transaktionsdatensatz und der relevante Vertrag bestimmen die anwendbare Währung und jeden aufgezeichneten Umrechnungskurs.",
            "Eine Investition ist möglicherweise nicht übertragbar oder auf Abruf rückzahlbar. Es gibt möglicherweise keinen Sekundärmarkt. Auszahlungsanfragen unterliegen den anwendbaren Wallet-Bedingungen, der Verifizierung und den verfügbaren Abwicklungskanälen; eine geschätzte Bearbeitungszeit ist kein garantiertes Abschlussdatum."
          ]
        },
        {
          "bullets": [],
          "heading": "5. Betriebs-, Rechts- und Technologierisiko",
          "paragraphs": [
            "Geschäftsabläufe, Dokumentation, Personal, Systeme, Cybersicherheit, Rechts- oder regulatorische Änderungen sowie steuerliche Behandlung können ein Projekt beeinflussen. Die Plattform kann nicht verfügbar sein oder Informationen anzeigen, die später eine Korrektur erfordern. Bestätigen Sie wichtige Bedingungen anhand des unterzeichneten Vertrags und der offiziellen Transaktionsunterlagen."
          ]
        },
        {
          "bullets": [],
          "heading": "6. Schätzungen und vergangene Ergebnisse",
          "paragraphs": [
            "Prognosen, Zieldaten, Finanzierungsfortschritt, Beispielrechnungen und historische Ergebnisse sind keine Versprechen zukünftiger Leistung. Frühere Ergebnisse, sofern dargestellt, sagen zukünftige Ergebnisse nicht zuverlässig voraus. Tatsächliche Ergebnisse können wesentlich von den Schätzungen abweichen."
          ]
        },
        {
          "bullets": [],
          "heading": "7. Unabhängige Bewertung",
          "paragraphs": [
            "Die Plattform stellt Informationen bereit, keine persönliche Finanz-, Rechts-, Buchhaltungs- oder Steuerberatung. Bewerten Sie die Risiken, lesen Sie alle Projektunterlagen und holen Sie unabhängigen professionellen Rat ein, der Ihrer Situation angemessen ist. Bitten Sie den Support, fehlende oder inkonsistente Angebotsinformationen zu klären, bevor Sie fortfahren."
          ]
        },
        {
          "bullets": [],
          "heading": "8. Bestätigung",
          "paragraphs": [
            "Indem Sie diesen Hinweis separat bestätigen und eine Investitionsanfrage einreichen, bestätigen Sie, dass Sie die Gelegenheit hatten, diese Risiken zu überprüfen. Die Bestätigung verzichtet nicht auf Rechte, auf die rechtlich nicht verzichtet werden kann, und garantiert nicht, dass eine Anfrage akzeptiert wird."
          ]
        }
      ],
      "reviewStatus": "pending"
    }
  },
  "investment-terms": {
    "ru": {
      "title": "Инвестиционные условия",
      "summary": "Общие условия для инвесторов на платформе. Конкретное предложение и подписанное Инвестиционное соглашение регулируют каждую инвестицию.",
      "sections": [
        {
          "bullets": [],
          "heading": "1. Контракт по конкретной возможности",
          "paragraphs": [
            "Каждая возможность привязана к торговому или бизнес-проекту, описанному в соответствующем предложении. Товар, стороны сделки, пункт назначения, ожидаемые сроки, сумма участия, база расчета, условия расчетов и валюта должны быть подтверждены в этом предложении и подписанном Инвестиционном соглашении. Не делайте выводов об отсутствующих условиях на основе других проектов или оценок на информационной панели.",
            "Если данные общие условия противоречат подписанному Инвестиционному соглашению, подписанное соглашение имеет приоритет в отношении соответствующей инвестиции, с учетом положений императивного права."
          ]
        },
        {
          "bullets": [],
          "heading": "2. Право на участие и процесс запроса",
          "paragraphs": [
            "Только учетная запись, соответствующая текущим требованиям к возможности и имеющая подтвержденный сервером статус Verified (Верифицирован), может подать инвестиционный запрос. OG Exports (Private) Limited может запросить информацию, необходимую для оценки права на участие. Отображаемая возможность может быть закрыта, изменена или стать недоступной до того, как запрос будет принят.",
            "Подача запроса сама по себе не является доказательством получения средств или заключения инвестиционного соглашения. Авторитетный ответ, платежный документ и подписанное соглашение определяют принятие и статус."
          ]
        },
        {
          "bullets": [],
          "heading": "3. Торговые записи и обновления",
          "paragraphs": [
            "Документы по проекту, торговые идентификаторы, ход финансирования, контрольные этапы и обновления предоставляются по мере их регистрации компанией OG Exports (Private) Limited. Планируемая дата отгрузки или статус выплаты предоплаты не являются доказательством того, что отгрузка, распределение или расчеты состоялись. Только явно подтвержденная запись о транзакции устанавливает факт завершения."
          ]
        },
        {
          "bullets": [],
          "heading": "4. Капитал, доходы и расчеты",
          "paragraphs": [
            "Капитал подвержен рискам, описанным в «Раскрытии рисков». Никакая прибыль, возврат основной суммы, распределение или сроки расчетов не гарантируются, если иное прямо не указано в подписанном соглашении. Любой расчет доходности, допустимые удержания, условия оплаты и сроки распределения должны определяться на основе конкретного соглашения и окончательных записей о транзакциях.",
            "Завершенный инвестиционный доход может быть записан как единый кредит. Платформа не будет разделять основную сумму и прибыль, если это не подтверждается авторитетными записями."
          ]
        },
        {
          "bullets": [],
          "heading": "5. Валюта и записи кошелька",
          "paragraphs": [
            "В предложении и подписанном соглашении указывается инвестиционная валюта. Валюта, отображаемая в вашем профиле и кошельке, может отличаться от валюты инвестирования или расчетов. Конвертация, если она поддерживается, использует зарегистрированный курс и сумму транзакции; более поздние курсы не пересматривают прошлые транзакции."
          ]
        },
        {
          "bullets": [],
          "heading": "6. Депозиты и выводы средств",
          "paragraphs": [
            "Следуйте только проверенным платежным инструкциям, указанным в вашей учетной записи или подтвержденным уполномоченным персоналом OG Exports (Private) Limited. Депозит признается только после того, как официальная запись подтвердит получение и прохождение любой необходимой проверки.",
            "Текущие операции по выводу средств доступны только с кошельков в USD, с минимальной банковской выплатой в USD 100 и фиксированной комиссией в размере USD 2, добавляемой к выплате. Устаревшие кошельки должны пройти конвертацию, зафиксированную сервером, прежде чем можно будет запросить вывод средств. Ориентировочное время обработки составляет 2 рабочих дня. Эти текущие операционные значения могут быть изменены в будущем; подтвержденные условия по вашему запросу имеют приоритет. Оценки времени обработки не являются гарантией."
          ]
        },
        {
          "bullets": [],
          "heading": "7. Записи, выписки и вопросы",
          "paragraphs": [
            "Сохраняйте копии вашего предложения, подписанного соглашения, подтверждений, квитанций и выписок по счету. Сообщайте о расхождениях через канал поддержки в приложении и включайте соответствующий ID транзакции или ссылку. Проверка службой поддержки сама по себе не меняет зарегистрированную транзакцию."
          ]
        },
        {
          "bullets": [],
          "heading": "8. Риск и независимая консультация",
          "paragraphs": [
            "Инвестиции в торговлю связаны с коммерческими, контрагентскими, рыночными, логистическими, валютными, ликвидными, правовыми, операционными и технологическими рисками. Платформа не дает индивидуальных консультаций и не обещает доходности. Прочитайте «Раскрытие рисков» и получите независимую консультацию перед вложением средств."
          ]
        }
      ],
      "reviewStatus": "pending"
    },
    "zh-CN": {
      "title": "投资条款",
      "summary": "投资者与平台的一般性条款。具体的要约和已签署的投资协议约束每一笔投资。",
      "sections": [
        {
          "bullets": [],
          "heading": "1. 针对具体机会的合同",
          "paragraphs": [
            "每一项机会均与该要约所描述的贸易或商业项目相关联。商品、贸易方、目的地、预计时间表、参与金额、计算基础、结算条件及货币必须在该要约及其签署的《投资协议》中予以确认。请勿从其他项目或仪表盘估算值中推断缺失的条款。",
            "如果这些通用条款与签署的《投资协议》存在差异，则在适用强制性法律的前提下，以签署的协议为准，约束相关投资。"
          ]
        },
        {
          "bullets": [],
          "heading": "2. 资格与申请流程",
          "paragraphs": [
            "只有符合当前机会要求并具有服务器确认的“已验证（Verified）”状态的账户方可提交投资。OG Exports (Private) Limited 可能会要求提供评估资格所需的信息。展示的机会在请求被接受之前可能会关闭、变更或变得不可用。",
            "提交请求本身并不证明资金已收到或投资协议已执行。权威的回复、付款记录和签署的协议决定接受情况和状态。"
          ]
        },
        {
          "bullets": [],
          "heading": "3. 贸易记录与更新",
          "paragraphs": [
            "项目文件、贸易标识符、融资进度、里程碑及更新信息均在由 OG Exports (Private) Limited 记录时提供。计划装运日期或预付款支付状态并非装运、分销或结算已经发生的证据。仅有明确确认的交易记录方可确立完成状态。"
          ]
        },
        {
          "bullets": [],
          "heading": "4. 资本、回报与结算",
          "paragraphs": [
            "资本面临《风险披露》中所述的风险。除非签署的协议另有明确说明，否则不保证任何利润、本金归还、分配或结算时间。任何回报计算、允许的扣除、支付条件和分配时间必须依据具体协议和最终交易记录执行。",
            "已完成的投资回报可能记录为一笔贷项。除非权威记录支持该项明细，否则本平台不会将本金和利润拆分。"
          ]
        },
        {
          "bullets": [],
          "heading": "5. 货币与钱包记录",
          "paragraphs": [
            "要约和签署的协议会明确投资货币。您的个人资料和钱包显示的货币可能与投资或结算货币不同。在支持的情况下，转换使用交易记录的汇率和金额；后续的汇率不会重新设定过往交易。"
          ]
        },
        {
          "bullets": [],
          "heading": "6. 存款与取款",
          "paragraphs": [
            "仅遵循账户中显示或经 OG Exports (Private) Limited 授权人员确认的已验证付款说明。存款仅在官方记录确认收到并经过任何必要审查后方予认可。",
            "目前的取款操作仅适用于美元（USD）钱包，最低银行支付金额为 USD 100，并在支付款项中额外扣除 USD 2 的固定费用。传统钱包在请求取款前必须完成服务器记录的转换。预计处理时间为 2 个工作日。这些当前操作数值可能会在未来发生变更；您的请求所确认的条款为准。处理预估时间不构成保证。"
          ]
        },
        {
          "bullets": [],
          "heading": "7. 记录、结单与问题",
          "paragraphs": [
            "请保存您的要约、签署的协议、确认书、收据和账户结单的副本。请通过应用内支持（Support）渠道及时报告差异，并包含相关的交易 ID 或参考号。支持审查本身并不会改变已记录的交易。"
          ]
        },
        {
          "bullets": [],
          "heading": "8. 风险与独立建议",
          "paragraphs": [
            "基于贸易的投资涉及商业、交易对手、市场、物流、货币、流动性、法律、运营和技术风险。本平台不提供个性化建议，也不承诺回报。在投入资金前，请阅读《风险披露》并获取独立建议。"
          ]
        }
      ],
      "reviewStatus": "pending"
    },
    "fr": {
      "title": "Conditions d'investissement",
      "summary": "Conditions générales investisseur-plateforme. L'offre spécifique et le Contrat d'investissement signé régissent chaque investissement.",
      "sections": [
        {
          "bullets": [],
          "heading": "1. Contrat spécifique à l'opportunité",
          "paragraphs": [
            "Chaque opportunité est liée au projet commercial ou de négoce décrit dans son offre. La marchandise, les parties au négoce, la destination, le calendrier prévu, le montant de la participation, la base de calcul, les conditions de règlement et la devise doivent être confirmés dans cette offre et dans le Contrat d'investissement signé correspondant. Ne déduisez pas de termes manquants d'un autre projet ou d'une estimation sur le tableau de bord.",
            "Si ces conditions générales diffèrent d'un Contrat d'investissement signé, l'accord signé prévaut pour l'investissement concerné, sous réserve des dispositions légales impératives."
          ]
        },
        {
          "bullets": [],
          "heading": "2. Éligibilité et processus de demande",
          "paragraphs": [
            "Seul un compte répondant aux exigences actuelles de l'opportunité et ayant le statut Vérifié confirmé par le serveur peut soumettre un investissement. OG Exports (Private) Limited peut demander les informations nécessaires pour évaluer l'éligibilité. Une opportunité affichée peut être clôturée, modifiée ou devenir indisponible avant l'acceptation d'une demande.",
            "La soumission d'une demande ne constitue pas, en soi, la preuve que les fonds ont été reçus ou qu'un contrat d'investissement a été exécuté. La réponse officielle, l'enregistrement du paiement et l'accord signé déterminent l'acceptation et le statut."
          ]
        },
        {
          "bullets": [],
          "heading": "3. Registres commerciaux et mises à jour",
          "paragraphs": [
            "Les documents du projet, les identifiants de négoce, l'avancement du financement, les jalons et les mises à jour sont fournis lorsqu'ils sont enregistrés par OG Exports (Private) Limited. Une date d'expédition prévue ou un statut de paiement anticipé ne constitue pas la preuve qu'une expédition, une distribution ou un règlement a eu lieu. Seul un registre de transaction expressément confirmé établit l'exécution."
          ]
        },
        {
          "bullets": [],
          "heading": "4. Capital, rendements et règlement",
          "paragraphs": [
            "Le capital est exposé aux risques décrits dans la Divulgation des risques. Aucun profit, remboursement de principal, distribution ou calendrier de règlement n'est garanti, sauf si l'accord signé le stipule expressément. Tout calcul de rendement, déduction autorisée, condition de paiement et calendrier de distribution doit être extrait de l'accord spécifique et des registres de transaction finaux.",
            "Un rendement d'investissement finalisé peut être enregistré sous la forme d'un crédit unique. La Plateforme ne séparera pas le principal du profit, à moins que les registres officiels ne soutiennent cette ventilation."
          ]
        },
        {
          "bullets": [],
          "heading": "5. Devise et registres de portefeuille",
          "paragraphs": [
            "Une offre et un accord signé identifient la devise d'investissement. La devise affichée sur votre profil et votre portefeuille peut différer de la devise d'investissement ou de règlement. La conversion, lorsqu'elle est prise en charge, utilise le taux et le montant enregistrés de la transaction ; les taux ultérieurs ne réévaluent pas les transactions passées."
          ]
        },
        {
          "bullets": [],
          "heading": "6. Dépôts et retraits",
          "paragraphs": [
            "Suivez uniquement les instructions de paiement vérifiées affichées dans votre compte ou confirmées par le personnel autorisé de OG Exports (Private) Limited. Un dépôt n'est reconnu qu'une fois que le registre officiel confirme la réception et tout examen requis.",
            "Les opérations de retrait actuelles ne sont disponibles qu'à partir de portefeuilles en USD, avec un paiement bancaire minimum de 100 USD et des frais fixes de 2 USD ajoutés au paiement. Les anciens portefeuilles doivent effectuer une conversion enregistrée par le serveur avant qu'un retrait puisse être demandé. Le délai de traitement estimé est de 2 jours ouvrables. Ces valeurs opérationnelles actuelles peuvent être modifiées ultérieurement ; les conditions confirmées lors de votre demande prévalent. Les estimations de traitement ne constituent pas une garantie."
          ]
        },
        {
          "bullets": [],
          "heading": "7. Registres, relevés et questions",
          "paragraphs": [
            "Conservez des copies de votre offre, de votre accord signé, des confirmations, des reçus et des relevés de compte. Signalez toute anomalie via le canal de Support de l'application dans les meilleurs délais et incluez l'identifiant de transaction ou la référence pertinente. L'examen par le Support ne modifie pas en soi une transaction enregistrée."
          ]
        },
        {
          "bullets": [],
          "heading": "8. Risques et conseils indépendants",
          "paragraphs": [
            "L'investissement basé sur le négoce comporte des risques commerciaux, de contrepartie, de marché, logistiques, de change, de liquidité, juridiques, opérationnels et technologiques. La Plateforme ne donne pas de conseils personnalisés et ne promet pas de rendement. Lisez la Divulgation des risques et obtenez des conseils indépendants avant d'engager des fonds."
          ]
        }
      ],
      "reviewStatus": "pending"
    },
    "es": {
      "title": "Términos de Inversión",
      "summary": "Términos generales entre el inversor y la plataforma. La oferta específica y el Acuerdo de Inversión firmado rigen cada inversión.",
      "sections": [
        {
          "bullets": [],
          "heading": "1. Contrato específico de la oportunidad",
          "paragraphs": [
            "Cada oportunidad está vinculada al proyecto comercial o de inversión descrito en su oferta. El producto, las partes intervinientes, el destino, el cronograma previsto, el monto de participación, la base de cálculo, las condiciones de liquidación y la moneda deben confirmarse en dicha oferta y en su correspondiente Acuerdo de Inversión firmado. No infiera términos faltantes de otro proyecto o de una estimación del panel de control.",
            "Si estos términos generales difieren de un Acuerdo de Inversión firmado, el acuerdo firmado prevalecerá respecto a la inversión pertinente, sujeto a la legislación imperativa."
          ]
        },
        {
          "bullets": [],
          "heading": "2. Elegibilidad y proceso de solicitud",
          "paragraphs": [
            "Solo una cuenta que cumpla con los requisitos actuales de la oportunidad y que tenga el estado Verificado confirmado por el servidor puede presentar una inversión. OG Exports podrá solicitar información necesaria para evaluar la elegibilidad. Una oportunidad mostrada puede cerrarse, modificarse o dejar de estar disponible antes de que se acepte una solicitud.",
            "La presentación de una solicitud no constituye, por sí misma, prueba de que los fondos fueron recibidos o de que se ejecutó un acuerdo de inversión. La respuesta autorizada, el registro de pago y el acuerdo firmado determinan la aceptación y el estado."
          ]
        },
        {
          "bullets": [],
          "heading": "3. Registros comerciales y actualizaciones",
          "paragraphs": [
            "Los documentos del proyecto, los identificadores comerciales, el progreso de la financiación, los hitos y las actualizaciones se proporcionan cuando son registrados por OG Exports. Una fecha de envío planificada o un estado de pago anticipado no constituyen evidencia de que el envío, la distribución o la liquidación hayan ocurrido. Solo un registro de transacción expresamente confirmado establece la finalización."
          ]
        },
        {
          "bullets": [],
          "heading": "4. Capital, rendimientos y liquidación",
          "paragraphs": [
            "El capital está expuesto a los riesgos descritos en la Divulgación de Riesgos. No se garantiza ningún beneficio, devolución de capital, distribución o plazo de liquidación a menos que el acuerdo firmado establezca expresamente lo contrario. Cualquier cálculo de rendimiento, deducción permitida, condición de pago y plazo de distribución debe obtenerse del acuerdo específico y de los registros finales de la transacción.",
            "Un rendimiento de inversión completado puede registrarse como un único crédito. La Plataforma no separará el capital y el beneficio a menos que los registros autorizados respalden dicho desglose."
          ]
        },
        {
          "bullets": [],
          "heading": "5. Registros de divisas y billeteras",
          "paragraphs": [
            "Una oferta y un acuerdo firmado identifican la moneda de inversión. La moneda que se muestra en su perfil y billetera puede ser diferente de la moneda de inversión o liquidación. La conversión, cuando sea compatible, utiliza la tasa y el monto registrados de la transacción; las tasas posteriores no modifican transacciones pasadas."
          ]
        },
        {
          "bullets": [],
          "heading": "6. Depósitos y retiros",
          "paragraphs": [
            "Siga únicamente las instrucciones de pago verificadas que se muestran en su cuenta o confirmadas por el personal autorizado de OG Exports. Un depósito se reconoce solo después de que el registro oficial confirme la recepción y cualquier revisión requerida.",
            "Las operaciones de retiro actuales están disponibles solo desde billeteras en USD, con un pago bancario mínimo de USD 100 y una tarifa fija de USD 2 agregada al pago. Las billeteras heredadas deben completar una conversión registrada en el servidor antes de que se pueda solicitar un retiro. El tiempo de procesamiento estimado es de 2 días hábiles. Estos valores operativos actuales pueden cambiar de forma prospectiva; los términos confirmados en su solicitud son los que rigen. Las estimaciones de procesamiento no son una garantía."
          ]
        },
        {
          "bullets": [],
          "heading": "7. Registros, estados de cuenta y consultas",
          "paragraphs": [
            "Conserve copias de su oferta, acuerdo firmado, confirmaciones, recibos y estados de cuenta. Informe cualquier discrepancia a través del canal de Soporte dentro de la aplicación de manera inmediata e incluya el ID de transacción o referencia pertinente. La revisión del Soporte no modifica por sí misma una transacción registrada."
          ]
        },
        {
          "bullets": [],
          "heading": "8. Riesgo y asesoramiento independiente",
          "paragraphs": [
            "La inversión basada en el comercio conlleva riesgos comerciales, de contraparte, de mercado, logísticos, cambiarios, de liquidez, legales, operativos y tecnológicos. La Plataforma no brinda asesoramiento personalizado ni promete un rendimiento. Lea la Divulgación de Riesgos y obtenga asesoramiento independiente antes de comprometer fondos."
          ]
        }
      ],
      "reviewStatus": "pending"
    },
    "de": {
      "title": "Investmentbedingungen",
      "summary": "Allgemeine Bedingungen für Investoren und Plattform. Das spezifische Angebot und der unterzeichnete Investitionsvertrag regeln jede Investition.",
      "sections": [
        {
          "bullets": [],
          "heading": "1. Opportunity-spezifischer Vertrag",
          "paragraphs": [
            "Jede Gelegenheit ist an das in ihrem Angebot beschriebene Handels- oder Geschäftsprojekt gebunden. Ware, Handelsparteien, Bestimmungsort, erwarteter Zeitrahmen, Beteiligungsbetrag, Berechnungsgrundlage, Abwicklungsbedingungen und Währung müssen in diesem Angebot und dem zugehörigen unterzeichneten Investitionsvertrag bestätigt werden. Leiten Sie fehlende Bedingungen nicht aus einem anderen Projekt oder einer Schätzung im Dashboard ab.",
            "Sollten diese allgemeinen Bedingungen von einem unterzeichneten Investitionsvertrag abweichen, so ist der unterzeichnete Vertrag für die jeweilige Investition maßgeblich, vorbehaltlich zwingenden Rechts."
          ]
        },
        {
          "bullets": [],
          "heading": "2. Teilnahmeberechtigung und Anfrageprozess",
          "paragraphs": [
            "Nur ein Konto, das die aktuellen Anforderungen für die Gelegenheit erfüllt und über den vom Server bestätigten Status 'Verifiziert' verfügt, kann eine Investition einreichen. OG Exports (Private) Limited kann Informationen anfordern, die zur Bewertung der Teilnahmeberechtigung erforderlich sind. Eine angezeigte Gelegenheit kann geschlossen werden, sich ändern oder nicht mehr verfügbar sein, bevor eine Anfrage akzeptiert wird.",
            "Die Einreichung einer Anfrage ist für sich genommen kein Nachweis dafür, dass Gelder eingegangen sind oder ein Investitionsvertrag abgeschlossen wurde. Die maßgebliche Antwort, der Zahlungsnachweis und der unterzeichnete Vertrag bestimmen die Annahme und den Status."
          ]
        },
        {
          "bullets": [],
          "heading": "3. Handelsaufzeichnungen und Updates",
          "paragraphs": [
            "Projektunterlagen, Handelskennungen, Finanzierungsfortschritt, Meilensteine und Updates werden bereitgestellt, sobald sie von OG Exports (Private) Limited erfasst wurden. Ein geplantes Versanddatum oder ein Status zur Auszahlung von Vorauszahlungen ist kein Nachweis dafür, dass Versand, Verteilung oder Abwicklung erfolgt sind. Nur ein ausdrücklich bestätigter Transaktionsdatensatz begründet den Abschluss."
          ]
        },
        {
          "bullets": [],
          "heading": "4. Kapital, Renditen und Abwicklung",
          "paragraphs": [
            "Das Kapital ist den in der Risikohinweis-Erklärung beschriebenen Risiken ausgesetzt. Weder Gewinn, Kapitalrückzahlung, Ausschüttung noch der Zeitpunkt der Abwicklung sind garantiert, sofern dies nicht ausdrücklich im unterzeichneten Vertrag anders festgelegt ist. Jegliche Renditeberechnung, zulässiger Abzug, Zahlungsbedingung und Zeitpunkt der Ausschüttung müssen dem spezifischen Vertrag und den endgültigen Transaktionsunterlagen entnommen werden.",
            "Eine abgeschlossene Investitionsrendite kann als eine einzelne Gutschrift verbucht werden. Die Plattform wird Kapital und Gewinn nicht aufteilen, es sei denn, die maßgeblichen Aufzeichnungen stützen diese Aufschlüsselung."
          ]
        },
        {
          "bullets": [],
          "heading": "5. Währung und Wallet-Aufzeichnungen",
          "paragraphs": [
            "Ein Angebot und ein unterzeichneter Vertrag identifizieren die Investitionswährung. Die in Ihrem Profil und Wallet angezeigte Währung kann von der Investitions- oder Abwicklungswährung abweichen. Die Umrechnung erfolgt, sofern unterstützt, unter Verwendung des aufgezeichneten Kurses und Betrags der Transaktion; spätere Kurse führen nicht zu einer Neuberechnung vergangener Transaktionen."
          ]
        },
        {
          "bullets": [],
          "heading": "6. Einzahlungen und Auszahlungen",
          "paragraphs": [
            "Befolgen Sie ausschließlich die in Ihrem Konto angezeigten oder von autorisierten Mitarbeitern von OG Exports (Private) Limited bestätigten Zahlungsanweisungen. Eine Einzahlung wird erst anerkannt, nachdem die offizielle Aufzeichnung den Eingang und eine etwaig erforderliche Prüfung bestätigt hat.",
            "Aktuelle Auszahlungsvorgänge sind nur von USD-Wallets möglich, mit einer Mindestauszahlung von USD 100 per Banküberweisung und einer pauschalen Gebühr von USD 2, die der Auszahlung hinzugefügt wird. Ältere Wallets müssen eine vom Server aufgezeichnete Umrechnung abschließen, bevor eine Auszahlung angefordert werden kann. Die geschätzte Bearbeitungszeit beträgt 2 Arbeitstage. Diese aktuellen operativen Werte können zukünftig geändert werden; die bestätigten Bedingungen Ihrer Anfrage sind maßgeblich. Bearbeitungsschätzungen stellen keine Garantie dar."
          ]
        },
        {
          "bullets": [],
          "heading": "7. Aufzeichnungen, Abrechnungen und Fragen",
          "paragraphs": [
            "Bewahren Sie Kopien Ihres Angebots, des unterzeichneten Vertrags, der Bestätigungen, Quittungen und Kontoauszüge auf. Melden Sie Unstimmigkeiten umgehend über den In-App-Support-Kanal und geben Sie die entsprechende Transaktions-ID oder Referenz an. Eine Überprüfung durch den Support ändert für sich genommen keine aufgezeichnete Transaktion."
          ]
        },
        {
          "bullets": [],
          "heading": "8. Risiko und unabhängige Beratung",
          "paragraphs": [
            "Handelsbasierte Investitionen sind mit wirtschaftlichen, Gegenpartei-, Markt-, Logistik-, Währungs-, Liquiditäts-, Rechts-, Betriebs- und Technologierisiken verbunden. Die Plattform erteilt keine individuelle Beratung und verspricht keine Rendite. Lesen Sie die Risikohinweis-Erklärung und holen Sie unabhängigen Rat ein, bevor Sie Gelder festlegen."
          ]
        }
      ],
      "reviewStatus": "pending"
    }
  },
  "user-agreement": {
    "ru": {
      "title": "Пользовательское соглашение",
      "summary": "OG Exports (Private) Limited · Вступает в силу с момента публикации. Это Соглашение объясняет доступ к учетной записи, обязанности и ограничения инвесторской платформы OG Exports.",
      "sections": [
        {
          "bullets": [],
          "heading": "1. Соглашение и принятие",
          "paragraphs": [
            "Это Пользовательское соглашение заключается между вами и OG Exports (Private) Limited. Создание учетной записи, вход в систему или использование функций инвестора означает ваше согласие с этим Соглашением, Условиями обслуживания, Политикой конфиденциальности и Раскрытием рисков. Права и обязанности, специфичные для возможности, изложены в соответствующем подписанном Инвестиционном соглашении."
          ]
        },
        {
          "bullets": [
            "Используйте свои собственные точные данные личности и контактные данные и поддерживайте их в актуальном состоянии.",
            "Защищайте пароли, коды верификации, устройства и доступ для восстановления. Не передавайте и не делегируйте доступ к учетной записи.",
            "Немедленно сообщайте в службу поддержки, если ваша учетная запись или транзакция могли быть доступны или изменены без разрешения.",
            "Вы несете ответственность за действия, совершенные через вашу учетную запись, за исключением случаев, когда применимое право предусматривает иное."
          ],
          "heading": "2. Детали учетной записи и безопасность",
          "paragraphs": []
        },
        {
          "bullets": [],
          "heading": "3. Верификация и доступ к инвестициям",
          "paragraphs": [
            "Мы можем запрашивать записи личности, адреса или бизнеса для защиты учетных записей, выполнения применимых требований и оценки права на использование услуг. Функции инвестирования требуют статуса Verified (Верифицирован), сообщаемого сервером, и любого дополнительного соответствия требованиям конкретного предложения. Верификация не является обещанием того, что инвестиционный запрос будет принят."
          ]
        },
        {
          "bullets": [
            "Используйте сервис для законных личных или бизнес-целей и соблюдайте применимые законы и подписанные соглашения.",
            "Не выдавайте себя за кого-либо, не искажайте источник средств, не предоставляйте фальсифицированные записи, не используйте чужую учетную запись неправомерно, не вмешивайтесь в безопасность, не собирайте данные ограниченного доступа, не осуществляйте обратную разработку защищенных компонентов и не нарушайте работу сервиса.",
            "Загружайте только материалы, которые вы уполномочены предоставлять. Не загружайте вредоносное ПО, незаконный контент или чувствительную информацию другого человека, если Платформа специально не запрашивает это."
          ],
          "heading": "4. Ваше использование Платформы",
          "paragraphs": []
        },
        {
          "bullets": [],
          "heading": "5. Информация и записи транзакций",
          "paragraphs": [
            "Вы можете просматривать записи об учетной записи, кошельке, инвестициях, торговле и поддержке, предоставленные OG Exports (Private) Limited. Эти записи являются операционной информацией; они не заменяют подписанный контракт, банковское подтверждение или официальную запись источника. Свяжитесь со службой поддержки, если существенная запись кажется неверной.",
            "Запрос, отмеченный как отправленный, находящийся на рассмотрении, одобренный или обрабатываемый, не обязательно является завершенным. Завершение показывается только тогда, когда авторитетная запись говорит, что она завершена."
          ]
        },
        {
          "bullets": [],
          "heading": "6. Коммуникации и уведомления",
          "paragraphs": [
            "Мы можем отправлять уведомления об учетной записи, безопасности, поддержке, верификации, транзакциях и уведомления, требуемые по закону, на контактные данные, зарегистрированные в вашей учетной записи, или через каналы внутри приложения. Поддерживайте контактную информацию в актуальном состоянии и просматривайте оповещения безопасности. Дополнительные настройки уведомлений могут быть изменены в приложении, но основные сервисные или юридические уведомления все равно могут отправляться."
          ]
        },
        {
          "bullets": [],
          "heading": "7. Приостановка и закрытие учетной записи",
          "paragraphs": [
            "Мы можем ограничить или приостановить доступ, когда это обоснованно требуется для безопасности, соблюдения законодательства, подозреваемого мошенничества, неточной информации или нарушения этого Соглашения. Там, где это разрешено, мы сообщим причину и доступные следующие шаги.",
            "Вы можете запросить удаление учетной записи и данных через страницу предпочтений данных в приложении или страницу публичного удаления учетной записи. Служба поддержки проверяет владение и рассматривает активные инвестиции и обязательства по хранению. Отправка запроса не приводит к немедленному прекращению действия учетной записи; записи, которые должны быть сохранены, могут оставаться под ограниченным доступом."
          ]
        },
        {
          "bullets": [],
          "heading": "8. Отсутствие консультаций или гарантированных результатов",
          "paragraphs": [
            "Платформа не предоставляет персонализированные инвестиционные, юридические, налоговые или бухгалтерские консультации. Никакое отображение, прогноз, оценка, этап отгрузки или статус финансирования не гарантирует коммерческий исход, доход, погашение или дату. Прочитайте «Раскрытие рисков» и конкретный контракт перед совершением действий."
          ]
        },
        {
          "bullets": [],
          "heading": "9. Изменения, регулирующие условия и контакты",
          "paragraphs": [
            "Мы можем обновлять это Соглашение и публиковать пересмотренную дату. Условия обслуживания регулируют общее использование Платформы. Подписанное Инвестиционное соглашение регулирует вопросы инвестиций, специфичные для проекта, если оно не соответствует общему тексту Платформы, с учетом императивного права. Применимое право и место спора являются теми, которые указаны в применимом подписанном соглашении или иным образом определены применимым правом.",
            "Вопросы или уведомления об учетной записи: OG Exports (Private) Limited, info@ogexports.co, https://www.ogexports.co."
          ]
        }
      ],
      "reviewStatus": "pending"
    },
    "zh-CN": {
      "title": "用户协议",
      "summary": "OG Exports (Private) Limited · 发布即生效。本协议说明账户访问、责任以及 OG Exports 投资者平台的限制。",
      "sections": [
        {
          "bullets": [],
          "heading": "1. 协议与接受",
          "paragraphs": [
            "本《用户协议》在您与 OG Exports (Private) Limited 之间签署。创建账户、登录或使用投资者功能意味着您同意本协议、《服务条款》、《隐私政策》和《风险披露》。与具体机会相关的权利和义务在适用的已签署《投资协议》中规定。"
          ]
        },
        {
          "bullets": [
            "使用您自己准确的身份和联系详情，并保持其最新。",
            "保护密码、验证码、设备和恢复访问权限。请勿共享或转让账户访问权限。",
            "如果您的账户或交易可能在未经授权的情况下被访问或更改，请及时告知支持团队。",
            "除非适用法律另有规定，否则您应对通过您的账户执行的活动负责。"
          ],
          "heading": "2. 账户详情与安全",
          "paragraphs": []
        },
        {
          "bullets": [],
          "heading": "3. 验证与投资访问",
          "paragraphs": [
            "我们可能要求提供身份、地址或商业记录以保护账户、满足适用要求并评估服务资格。投资功能要求具备服务器报告的“已验证（Verified）”状态及任何额外要约特定的资格。验证并非保证投资请求会被接受。"
          ]
        },
        {
          "bullets": [
            "将本服务用于合法的个人或商业目的，并遵守适用法律和已签署的协议。",
            "不得冒充任何人、谎报资金来源、提供伪造记录、滥用他人账户、干扰安全、抓取受限数据、对受保护组件进行逆向工程，或扰乱本服务。",
            "仅上传您有权提供的内容。除非平台特别要求，否则不得上传恶意软件、非法内容或他人的敏感信息。"
          ],
          "heading": "4. 您对本平台的使用",
          "paragraphs": []
        },
        {
          "bullets": [],
          "heading": "5. 信息与交易记录",
          "paragraphs": [
            "您可以查看 OG Exports (Private) Limited 提供的账户、钱包、投资、贸易和支持记录。这些记录属于运营信息；它们不取代签署的合同、银行确认书或官方来源记录。如果重要记录似乎不正确，请联系支持团队。",
            "被标记为“提交（submitted）”、“待处理（pending）”、“批准（approved）”或“处理中（processing）”的请求不一定完成。只有当权威记录显示完成时，方视为完成。"
          ]
        },
        {
          "bullets": [],
          "heading": "6. 通信与通知",
          "paragraphs": [
            "我们可能会向您在账户中注册的联系详情或通过应用内渠道发送账户、安全、支持、验证、交易和法律要求的通知。请保持联系信息最新并查看安全警报。可选的通知偏好可在应用程序中更改，但基本服务或法律通知可能仍会发送。"
          ]
        },
        {
          "bullets": [],
          "heading": "7. 暂停与账户关闭",
          "paragraphs": [
            "出于安全、法律合规、涉嫌欺诈、信息不准确或违反本协议的需要，我们可能会限制或暂停访问。在许可的情况下，我们将沟通原因及可采取的后续步骤。",
            "您可以通过应用内数据偏好页面或公开的账户删除页面请求删除账户和数据。支持团队将验证所有权并审查活跃投资和保留义务。提交请求不会立即终止账户；必须保留的记录可能仍然受到受限访问的限制。"
          ]
        },
        {
          "bullets": [],
          "heading": "8. 无建议或保证结果",
          "paragraphs": [
            "本平台不提供个性化的投资、法律、税务或会计建议。任何展示、预测、估算、装运里程碑或融资状态均不能保证商业结果、回报、还款或日期。在采取行动前，请审阅《风险披露》和具体合同。"
          ]
        },
        {
          "bullets": [],
          "heading": "9. 变更、管辖条款与联系方式",
          "paragraphs": [
            "我们可能会更新本协议并发布修订日期。《服务条款》管辖一般平台使用。若与一般平台内容不一致，已签署的《投资协议》在适用强制性法律的前提下，管辖项目特定的投资事项。管辖法律和争议解决地点为适用已签署协议中所述，或由适用法律确定。",
            "问题或账户通知：OG Exports (Private) Limited, info@ogexports.co, https://www.ogexports.co。"
          ]
        }
      ],
      "reviewStatus": "pending"
    },
    "fr": {
      "title": "Contrat d'utilisation",
      "summary": "OG Exports (Private) Limited · Entrée en vigueur lors de sa publication. Ce Contrat explique l'accès au compte, les responsabilités et les limites de la plateforme d'investissement de OG Exports (Private) Limited.",
      "sections": [
        {
          "bullets": [],
          "heading": "1. Accord et acceptation",
          "paragraphs": [
            "Ce Contrat d'utilisation est conclu entre vous et OG Exports (Private) Limited. Créer un compte, se connecter ou utiliser les fonctionnalités d'investissement signifie que vous acceptez ce Contrat, les Conditions d'utilisation, la Politique de confidentialité et la Divulgation des risques. Les droits et devoirs spécifiques à l'opportunité sont énoncés dans le Contrat d'investissement signé applicable."
          ]
        },
        {
          "bullets": [
            "Utilisez votre propre identité et vos coordonnées exactes et maintenez-les à jour.",
            "Protégez les mots de passe, les codes de vérification, les appareils et l'accès de récupération. Ne partagez pas et ne transférez pas l'accès au compte.",
            "Informez rapidement le Support si votre compte ou une transaction a pu être consulté ou modifié sans autorisation.",
            "Vous êtes responsable de l'activité effectuée via votre compte, sauf si la loi applicable en dispose autrement."
          ],
          "heading": "2. Détails du compte et sécurité",
          "paragraphs": []
        },
        {
          "bullets": [],
          "heading": "3. Vérification et accès à l'investissement",
          "paragraphs": [
            "Nous pouvons demander des registres d'identité, d'adresse ou commerciaux pour protéger les comptes, respecter les exigences applicables et évaluer l'éligibilité au service. Les fonctionnalités d'investissement nécessitent le statut Vérifié rapporté par le serveur et toute éligibilité supplémentaire spécifique à l'offre. La vérification n'est pas une promesse qu'une demande d'investissement sera acceptée."
          ]
        },
        {
          "bullets": [
            "Utilisez le service à des fins personnelles ou commerciales légitimes et conformez-vous aux lois applicables et aux accords signés.",
            "N'usurpez l'identité de personne, ne déclarez pas faussement la source des fonds, ne fournissez pas de registres falsifiés, n'utilisez pas abusivement un autre compte, n'interférez pas avec la sécurité, ne grattez pas de données restreintes, ne faites pas d'ingénierie inverse sur les composants protégés, et ne perturbez pas le service.",
            "Téléchargez uniquement le matériel que vous êtes autorisé à fournir. Ne téléchargez pas de logiciels malveillants, de contenu illicite ou les informations sensibles d'une autre personne, sauf si la Plateforme le demande spécifiquement."
          ],
          "heading": "4. Votre utilisation de la Plateforme",
          "paragraphs": []
        },
        {
          "bullets": [],
          "heading": "5. Informations et registres de transaction",
          "paragraphs": [
            "Vous pouvez consulter les registres de compte, de portefeuille, d'investissement, de négoce et de support mis à disposition par OG Exports (Private) Limited. Ces registres sont des informations opérationnelles ; ils ne remplacent pas un contrat signé, une confirmation bancaire ou un registre de source officielle. Contactez le Support si un registre matériel semble incorrect.",
            "Une demande marquée soumise, en attente, approuvée ou en cours de traitement n'est pas nécessairement finalisée. La finalisation n'est indiquée que lorsque le registre officiel indique qu'elle est complète."
          ]
        },
        {
          "bullets": [],
          "heading": "6. Communications et notifications",
          "paragraphs": [
            "Nous pouvons envoyer des avis concernant le compte, la sécurité, le support, la vérification, les transactions et les avis légalement requis aux coordonnées enregistrées sur votre compte ou via des canaux intégrés à l'application. Gardez vos coordonnées à jour et examinez les alertes de sécurité. Les préférences de notification facultatives peuvent être modifiées dans l'application, mais les avis de service essentiels ou légaux peuvent toujours être envoyés."
          ]
        },
        {
          "bullets": [],
          "heading": "7. Suspension et clôture de compte",
          "paragraphs": [
            "Nous pouvons restreindre ou suspendre l'accès lorsque cela est raisonnablement requis pour la sécurité, la conformité légale, la fraude suspectée, des informations inexactes ou la violation de ce Contrat. Lorsque cela est autorisé, nous communiquerons la raison et les prochaines étapes disponibles.",
            "Vous pouvez demander la suppression de votre compte et de vos données via la page Préférences de données intégrée à l'application ou la page publique de suppression de compte. Le Support vérifie la propriété et examine les investissements actifs ainsi que les devoirs de conservation. La soumission ne résilie pas immédiatement le compte ; les registres qui doivent être conservés peuvent rester soumis à un accès restreint."
          ]
        },
        {
          "bullets": [],
          "heading": "8. Aucun conseil ou promesse de résultat",
          "paragraphs": [
            "La Plateforme ne fournit pas de conseils personnalisés en matière d'investissement, de droit, de fiscalité ou de comptabilité. Aucun affichage, projection, estimation, jalon d'expédition ou statut de financement ne garantit un résultat commercial, un rendement, un remboursement ou une date. Examinez la Divulgation des risques et le contrat spécifique avant d'agir."
          ]
        },
        {
          "bullets": [],
          "heading": "9. Changements, conditions régissant et contact",
          "paragraphs": [
            "Nous pouvons mettre à jour ce Contrat et publier une date révisée. Les Conditions d'utilisation régissent l'utilisation générale de la Plateforme. Le Contrat d'investissement signé régit les questions d'investissement spécifiques au projet en cas d'incohérence avec le texte général de la Plateforme, sous réserve de la loi impérative. La loi applicable et le lieu de règlement des litiges sont ceux énoncés dans l'accord signé applicable ou autrement déterminés par la loi applicable.",
            "Questions ou avis concernant le compte : OG Exports (Private) Limited, info@ogexports.co, https://www.ogexports.co."
          ]
        }
      ],
      "reviewStatus": "pending"
    },
    "es": {
      "title": "Acuerdo de Usuario",
      "summary": "OG Exports (Private) Limited · Efectiva desde su publicación. Este Acuerdo explica el acceso a la cuenta, las responsabilidades y los límites de la Plataforma de inversores de OG Exports.",
      "sections": [
        {
          "bullets": [],
          "heading": "1. Acuerdo y aceptación",
          "paragraphs": [
            "Este Acuerdo de Usuario es entre usted y OG Exports (Private) Limited. Crear una cuenta, iniciar sesión o usar funciones de inversor significa que usted acepta este Acuerdo, los Términos de Servicio, la Política de Privacidad y la Divulgación de Riesgos. Los derechos y deberes específicos de la oportunidad se establecen en el Acuerdo de Inversión firmado aplicable."
          ]
        },
        {
          "bullets": [
            "Utilice su propia identidad y detalles de contacto precisos y manténgalos actualizados.",
            "Proteja contraseñas, códigos de verificación, dispositivos y acceso de recuperación. No comparta ni transfiera el acceso a la cuenta.",
            "Informe al Soporte de inmediato si su cuenta o una transacción pudo haber sido accedida o cambiada sin autorización.",
            "Usted es responsable de la actividad realizada a través de su cuenta excepto donde la ley aplicable disponga lo contrario."
          ],
          "heading": "2. Detalles de cuenta y seguridad",
          "paragraphs": []
        },
        {
          "bullets": [],
          "heading": "3. Verificación y acceso a la inversión",
          "paragraphs": [
            "Podemos solicitar registros de identidad, dirección o comerciales para proteger cuentas, cumplir con los requisitos aplicables y evaluar la elegibilidad para el servicio. Las funciones de inversión requieren el estado Verificado reportado por el servidor y cualquier elegibilidad específica de oferta adicional. La verificación no es una promesa de que una solicitud de inversión será aceptada."
          ]
        },
        {
          "bullets": [
            "Utilice el servicio para fines personales o comerciales legítimos y cumpla con las leyes aplicables y los acuerdos firmados.",
            "No se haga pasar por nadie, declare erróneamente la fuente de los fondos, proporcione registros falsificados, haga mal uso de otra cuenta, interfiera con la seguridad, extraiga datos restringidos, realice ingeniería inversa de componentes protegidos, o interrumpa el servicio.",
            "Cargue solo material que esté autorizado a proporcionar. No cargue malware, contenido ilegal o información sensible de otra persona a menos que la Plataforma lo solicite específicamente."
          ],
          "heading": "4. Su uso de la Plataforma",
          "paragraphs": []
        },
        {
          "bullets": [],
          "heading": "5. Información y registros de transacciones",
          "paragraphs": [
            "Usted puede ver los registros de cuenta, billetera, inversión, comercio y soporte puestos a disposición por OG Exports. Estos registros son información operativa; no reemplazan un contrato firmado, confirmación bancaria o registro de fuente oficial. Contacte al Soporte si un registro material parece incorrecto.",
            "Una solicitud marcada como enviada, pendiente, aprobada o en procesamiento no está necesariamente completa. La finalización se muestra solo cuando el registro autorizado dice que está completo."
          ]
        },
        {
          "bullets": [],
          "heading": "6. Comunicaciones y notificaciones",
          "paragraphs": [
            "Podemos enviar avisos de cuenta, seguridad, soporte, verificación, transacciones y avisos legalmente requeridos a los detalles de contacto registrados en su cuenta o a través de canales dentro de la aplicación. Mantenga la información de contacto actualizada y revise las alertas de seguridad. Las preferencias de notificación opcionales se pueden cambiar en la aplicación, pero pueden seguir enviándose avisos legales o de servicio esenciales."
          ]
        },
        {
          "bullets": [],
          "heading": "7. Suspensión y cierre de cuenta",
          "paragraphs": [
            "Podemos restringir o suspender el acceso donde sea razonablemente necesario por motivos de seguridad, cumplimiento legal, sospecha de fraude, información inexacta o incumplimiento de este Acuerdo. Donde esté permitido, comunicaremos la razón y los siguientes pasos disponibles.",
            "Usted puede solicitar la eliminación de cuenta y datos a través de la página de Preferencias de datos dentro de la aplicación o la página pública de eliminación de cuentas. El Soporte verifica la propiedad y revisa las inversiones activas y las obligaciones de retención. La presentación no termina inmediatamente la cuenta; los registros que deben retenerse pueden permanecer sujetos a acceso restringido."
          ]
        },
        {
          "bullets": [],
          "heading": "8. Sin asesoramiento ni resultados garantizados",
          "paragraphs": [
            "La Plataforma no proporciona asesoramiento de inversión, legal, fiscal o contable personalizado. Ninguna visualización, proyección, estimación, hito de envío o estado de financiación garantiza un resultado comercial, rendimiento, pago o fecha. Revise la Divulgación de Riesgos y el contrato específico antes de actuar."
          ]
        },
        {
          "bullets": [],
          "heading": "9. Cambios, términos gobernantes y contacto",
          "paragraphs": [
            "Podemos actualizar este Acuerdo y publicar una fecha revisada. Los Términos de Servicio rigen el uso general de la Plataforma. El Acuerdo de Inversión firmado rige los asuntos de inversión específicos del proyecto si es inconsistente con la copia general de la Plataforma, sujeto a la ley imperativa. La ley aplicable y el lugar de disputa son los establecidos en el acuerdo firmado aplicable o determinados de otra manera por la ley aplicable.",
            "Preguntas o avisos de cuenta: OG Exports (Private) Limited, info@ogexports.co, https://www.ogexports.co."
          ]
        }
      ],
      "reviewStatus": "pending"
    },
    "de": {
      "title": "Nutzungsvereinbarung",
      "summary": "OG Exports (Private) Limited · Wirksam bei Veröffentlichung. Diese Vereinbarung erläutert den Kontozugang, die Verantwortlichkeiten und die Grenzen der Investoren-Plattform von OG Exports.",
      "sections": [
        {
          "bullets": [],
          "heading": "1. Vereinbarung und Annahme",
          "paragraphs": [
            "Diese Nutzungsvereinbarung besteht zwischen Ihnen und OG Exports (Private) Limited. Das Erstellen eines Kontos, die Anmeldung oder die Nutzung von Investorenfunktionen bedeutet, dass Sie dieser Vereinbarung, den Nutzungsbedingungen, der Datenschutzrichtlinie und dem Risikohinweis zustimmen. Opportunity-spezifische Rechte und Pflichten sind im jeweils unterzeichneten Investitionsvertrag festgelegt."
          ]
        },
        {
          "bullets": [
            "Verwenden Sie Ihre eigenen genauen Identitäts- und Kontaktdaten und halten Sie diese auf dem neuesten Stand.",
            "Schützen Sie Passwörter, Verifizierungscodes, Geräte und Wiederherstellungszugänge. Geben Sie den Kontozugang nicht weiter und übertragen Sie ihn nicht.",
            "Informieren Sie den Support umgehend, wenn auf Ihr Konto oder eine Transaktion unbefugt zugegriffen wurde oder diese geändert wurden.",
            "Sie sind verantwortlich für Aktivitäten, die über Ihr Konto durchgeführt werden, sofern anwendbares Recht nichts anderes vorsieht."
          ],
          "heading": "2. Kontodetails und Sicherheit",
          "paragraphs": []
        },
        {
          "bullets": [],
          "heading": "3. Verifizierung und Investitionszugang",
          "paragraphs": [
            "Wir können Identitäts-, Adress- oder Geschäftsunterlagen anfordern, um Konten zu schützen, anwendbare Anforderungen zu erfüllen und die Dienstberechtigung zu bewerten. Investitionsfunktionen erfordern den vom Server gemeldeten Status 'Verifiziert' und jede zusätzliche angebots-spezifische Berechtigung. Eine Verifizierung ist kein Versprechen, dass eine Investitionsanfrage akzeptiert wird."
          ]
        },
        {
          "bullets": [
            "Nutzen Sie den Dienst für legitime persönliche oder geschäftliche Zwecke und halten Sie anwendbare Gesetze und unterzeichnete Verträge ein.",
            "Geben Sie sich nicht als jemand anderes aus, machen Sie keine falschen Angaben zur Herkunft von Geldern, legen Sie keine gefälschten Unterlagen vor, missbrauchen Sie nicht das Konto eines anderen, stören Sie nicht die Sicherheit, scrapen Sie keine eingeschränkten Daten, führen Sie kein Reverse Engineering geschützter Komponenten durch oder stören Sie den Dienst nicht.",
            "Laden Sie nur Material hoch, für dessen Bereitstellung Sie autorisiert sind. Laden Sie keine Malware, rechtswidrigen Inhalte oder sensiblen Informationen einer anderen Person hoch, es sei denn, die Plattform fordert dies ausdrücklich an."
          ],
          "heading": "4. Ihre Nutzung der Plattform",
          "paragraphs": []
        },
        {
          "bullets": [],
          "heading": "5. Informations- und Transaktionsaufzeichnungen",
          "paragraphs": [
            "Sie können Konto-, Wallet-, Investitions-, Handels- und Supportaufzeichnungen einsehen, die von OG Exports (Private) Limited bereitgestellt werden. Diese Aufzeichnungen sind operative Informationen; sie ersetzen keinen unterzeichneten Vertrag, keine Bankbestätigung oder offizielle Quellenaufzeichnung. Kontaktieren Sie den Support, wenn eine wesentliche Aufzeichnung fehlerhaft erscheint.",
            "Eine Anfrage, die als eingereicht, ausstehend, genehmigt oder in Bearbeitung markiert ist, ist nicht notwendigerweise abgeschlossen. Ein Abschluss wird nur angezeigt, wenn die maßgebliche Aufzeichnung angibt, dass sie vollständig ist."
          ]
        },
        {
          "bullets": [],
          "heading": "6. Kommunikation und Benachrichtigungen",
          "paragraphs": [
            "Wir können Konto-, Sicherheits-, Support-, Verifizierungs-, Transaktions- und gesetzlich erforderliche Mitteilungen an die in Ihrem Konto registrierten Kontaktdaten oder über In-App-Kanäle senden. Halten Sie Kontaktinformationen aktuell und überprüfen Sie Sicherheitswarnungen. Optionale Benachrichtigungseinstellungen können in der Anwendung geändert werden, aber essenzielle Dienst- oder rechtliche Mitteilungen können dennoch gesendet werden."
          ]
        },
        {
          "bullets": [],
          "heading": "7. Aussetzung und Kontoschließung",
          "paragraphs": [
            "Wir können den Zugang einschränken oder aussetzen, wenn dies vernünftigerweise für Sicherheit, rechtliche Compliance, vermuteten Betrug, ungenaue Informationen oder einen Verstoß gegen diese Vereinbarung erforderlich ist. Wo zulässig, werden wir den Grund und verfügbare nächste Schritte kommunizieren.",
            "Sie können die Konto- und Datenlöschung über die In-App-Dateneinstellungen oder die öffentliche Seite zur Kontolöschung anfordern. Der Support überprüft die Inhaberschaft und prüft aktive Investitionen und Aufbewahrungspflichten. Die Einreichung beendet das Konto nicht sofort; Aufzeichnungen, die aufbewahrt werden müssen, können einem eingeschränkten Zugriff unterliegen."
          ]
        },
        {
          "bullets": [],
          "heading": "8. Keine Beratung oder garantierte Ergebnisse",
          "paragraphs": [
            "Die Plattform bietet keine personalisierte Anlage-, Rechts-, Steuer- oder Buchhaltungsberatung. Keine Anzeige, Projektion, Schätzung, Versandmeilenstein oder Finanzierungsstatus garantiert ein wirtschaftliches Ergebnis, eine Rendite, eine Rückzahlung oder ein Datum. Überprüfen Sie den Risikohinweis und den spezifischen Vertrag, bevor Sie handeln."
          ]
        },
        {
          "bullets": [],
          "heading": "9. Änderungen, geltende Bedingungen und Kontakt",
          "paragraphs": [
            "Wir können diese Vereinbarung aktualisieren und ein geändertes Datum veröffentlichen. Die Nutzungsbedingungen regeln die allgemeine Plattformnutzung. Der unterzeichnete Investitionsvertrag regelt projektspezifische Investitionsangelegenheiten, wenn diese im Widerspruch zu allgemeinen Plattformtexten stehen, vorbehaltlich zwingenden Rechts. Das anwendbare Recht und der Streitort sind die im jeweiligen unterzeichneten Vertrag angegebenen oder anderweitig nach anwendbarem Recht bestimmten.",
            "Fragen oder Kontomitteilungen: OG Exports (Private) Limited, info@ogexports.co, https://www.ogexports.co."
          ]
        }
      ],
      "reviewStatus": "pending"
    }
  }
};
