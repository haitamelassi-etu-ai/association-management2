export const SITE_INFO = {
  name: 'Association Al Amal',
  nameAr: 'جمعية الأمل',
  tagline: 'Solidarité • Dignité • Espoir',
  heroTagline: 'Ensemble, construisons un avenir meilleur',

  location: {
    city: 'Casablanca',
    country: 'Maroc'
  },

  leadership: {
    president: ''
  },

  stats: {
    beneficiariesCurrent: 160,
    beneficiariesMin: 100,
    foundedYear: 2020
  },

  contact: {
    emergencyPhoneLabel: 'Téléphone',
    emergencyPhone: '+212664039530',
    emergencyPhoneNote: '',
    email: 'contact@al-amal.ma',
    addressLines: ['Casablanca', 'Maroc'],
    googleMapsUrl: 'https://maps.app.goo.gl/cQMiZg736uZWRMVP9',
    hoursTitle: 'Horaires',
    hoursLines: ['Coordination par téléphone', 'Merci de nous contacter avant le dépôt']
  },

  social: {
    facebook: '#',
    twitter: '#',
    instagram: '#',
    linkedin: '#'
  },

  donation: {
    kindOnly: true,
    kinds: [
      'Repas',
      'Denrées alimentaires',
      'Vêtements',
      'Couvertures',
      "Produits d'hygiène"
    ]
  },

  story: {
    summaryAr:
      'جمعية الأمل — جمعية اجتماعية خيرية تنشط بمدينة الدار البيضاء، تعمل في الرعاية الاجتماعية والتنمية البشرية، وإيواء ورعاية المشردين، والدعم الاجتماعي والنفسي.',
    establishedContextAr:
      'تأسست الجمعية سنة 2020 لإيواء المتشردين، تحت رعاية السلطات المحلية لمقاطعات عين السبع الحي المحمدي.',
    centersAr: ['مركز جمعية الأمل (مقاطعة عين السبع)'],
    summaryFr:
      "Association Al Amal — association sociale et caritative basée à Casablanca, active dans la prise en charge des personnes en grande précarité : hébergement, accompagnement social et psychologique.",
    establishedContextFr:
      "L'association a été créée en 2020 pour l'hébergement des personnes sans-abri, en coordination avec les autorités locales (Arrondissement Aïn Sebaâ – Hay Mohammadi).",
    centersFr: ['Centre Al Amal (Aïn Sebaâ)']
  }
};

export const COPYRIGHT_YEAR = new Date().getFullYear();
