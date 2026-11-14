import type { AppLanguage } from '../types/restaurant';

export interface UiDictionary {
  nav: {
    home: string;
    menu: string;
    gallery: string;
    events: string;
    about: string;
    contact: string;
    reserveBtn: string;
  };
  hero: {
    badge: string;
    subtitle: string;
    tagline: string;
    feat1: string;
    feat2: string;
    feat3: string;
    feat4: string;
    ctaMenu: string;
    ctaVideo: string;
    scrollHint: string;
    cards: Array<{
      id: string;
      title: string;
      subtitle: string;
      target: 'menu' | 'gallery' | 'desserts' | 'events';
    }>;
  };
  ai: {
    title: string;
    status: string;
    greeting: string;
    chips: string[];
    placeholder: string;
    launcherSub: string;
  };
  guestOrder: {
    title: string;
    subtitle: string;
    tableLabel: string;
    takeaway: string;
    orderNow: string;
    myOrders: string;
    cancelOrder: string;
    cancelledByGuest: string;
    noOrdersYet: string;
    totalLabel: string;
    pastOrders: string;
    noPastOrders: string;
  };
  staff: {
    loginTitle: string;
    loginSubtitle: string;
    passwordLabel: string;
    unlockBtn: string;
    tabs: {
      orders: string;
      accounting: string;
      dashboard: string;
      tablesQr: string;
      menu: string;
      reservations: string;
      reviews: string;
    };
  };
  menuSection: {
    badge: string;
    heading: string;
    subheading: string;
    searchPlaceholder: string;
    noDishes: string;
    showAll: string;
    orderBased: string;
    addBtn: string;
    nfcBtn: string;
    qrBtn: string;
  };
  aboutSection: {
    badge: string;
    heading: string;
    p1: string;
    p2: string;
    quote: string;
    quoteAuthor: string;
    visitBadge: string;
    hoursTitle: string;
    locationLabel: string;
    cityState: string;
    hoursLabel: string;
    hoursDesc: string;
    formatsLabel: string;
    formatsValue: string;
    deskLabel: string;
    bookBtn: string;
  };
  gallerySection: {
    badge: string;
    heading: string;
    subheading: string;
    tabAll: string;
    tabFood: string;
    tabVibe: string;
    tabMenu: string;
  };
  reviewsSection: {
    badge: string;
    heading: string;
    subheading: string;
    verifiedReview: string;
    summaryTitle: string;
    ratingBreakdown: string;
  };
  reservationSection: {
    badge: string;
    heading: string;
    subheading: string;
    nameLabel: string;
    phoneLabel: string;
    dateLabel: string;
    timeLabel: string;
    partyLabel: string;
    requestsLabel: string;
    submitBtn: string;
    successTitle: string;
    successMessage: string;
  };
}

export const DICTIONARIES: Record<AppLanguage, UiDictionary> = {
  uz: {
    nav: {
      home: 'Bosh sahifa',
      menu: 'Menyu',
      gallery: 'Galereya',
      events: 'Tadbirlar',
      about: 'Biz haqimizda',
      contact: 'Aloqa',
      reserveBtn: 'Bron qilish',
    },
    hero: {
      badge: 'Premium Restaurant',
      subtitle: 'FAMILY RESTAURANT',
      tagline: "Ta'm, go'zallik va iliqlik bir joyda...",
      feat1: 'Premium taomlar',
      feat2: 'Zamonaviy muhit',
      feat3: 'Oila uchun qulay joy',
      feat4: 'Yuqori sifat',
      ctaMenu: "Menyu ko'rish",
      ctaVideo: "Video ko'rish",
      scrollHint: 'Pastga siljiting',
      cards: [
        { id: 'c1', title: 'Ajoyib Taomlar', subtitle: 'Eng mazali taomlar', target: 'menu' },
        { id: 'c2', title: 'Zamonaviy Muhit', subtitle: 'Nozik atmosfera', target: 'gallery' },
        { id: 'c3', title: 'Desertlar', subtitle: 'Shirin zavq', target: 'desserts' },
        { id: 'c4', title: 'Tadbirlar', subtitle: 'Unutilmas lahzalar', target: 'events' },
      ],
    },
    ai: {
      title: 'Gusto AI',
      status: 'Online',
      greeting: 'Salom! Sizga qanday yordam bera olaman?',
      chips: ['Menyu haqida', 'Stol band qilish', 'Restoran haqida', 'Boshqa savol'],
      placeholder: 'Xabar yozing...',
      launcherSub: 'Onlayn yordam',
    },
    guestOrder: {
      title: 'Sayqal Buyurtma Dasturi',
      subtitle: 'Stoldan turmasdan buyurtma bering — narxlar so‘mda (UZS)',
      tableLabel: 'Stol raqami',
      takeaway: 'Olib ketish',
      orderNow: 'Buyurtma berish',
      myOrders: 'Mening buyurtmalarim',
      cancelOrder: 'Atmen qilish (Bekor qilish)',
      cancelledByGuest: 'Mijoz tomonidan bekor qilindi',
      noOrdersYet: 'Hali buyurtma berilmadi. Menyu bo‘limidan taom tanlang.',
      totalLabel: 'Jami to‘lov',
      pastOrders: 'O‘tgan buyurtmalar tarixi (Past Orders)',
      noPastOrders: 'Hali yakunlangan buyurtmalar tarixi yo‘q.',
    },
    staff: {
      loginTitle: 'Sayqal Ichki Restoran Dasturi',
      loginSubtitle: 'Buyurtmalar, stollar va kirim-chiqim hisobini yuritish uchun parolni kiriting.',
      passwordLabel: 'Xodim / Menejer paroli',
      unlockBtn: 'Dasturni ochish',
      tabs: {
        orders: 'Jonli Buyurtmalar',
        accounting: 'Kirim-Chiqim & AI',
        dashboard: 'Umumiy Ko‘rsatkich',
        tablesQr: 'Stollar & QR/NFC',
        menu: 'Menyu Boshqaruvi',
        reservations: 'Bronlar',
        reviews: 'Sharhlar',
      },
    },
    menuSection: {
      badge: 'Sayqal Elektron Menyu · Zargarlik 9',
      heading: 'Menyu va Narxlar',
      subheading: 'Haqiqiy o‘zbek taomlari, gril, salatlar va desertlar jonli UZS narxlari bilan — stol NFC tekkizish yoki QR orqali.',
      searchPlaceholder: 'Taomlarni qidirish...',
      noDishes: 'Mos keluvchi taom topilmadi',
      showAll: 'Barcha taomlarni ko‘rsatish',
      orderBased: 'Buyurtma asosida',
      addBtn: 'Qo‘shish',
      nfcBtn: 'NFC Elektron Menyu',
      qrBtn: 'QR Kod & NFC Sozlash',
    },
    aboutSection: {
      badge: 'Bizning Tariximiz',
      heading: 'Oila An’analari va Toshkent Mehmonxonasi',
      p1: 'Sayqal nomi daryo toshlarining silliqligidan va qadimiy Chust misgarligidan ilhomlangan. Har tong Fergona Devzira guruchini ivitish, somsa xamirini qog‘ozdek yupqa yoyish va ochiq mangal ostida saksovul cho‘g‘ini yoqish bilan boshlanadi.',
      p2: 'Hovlimizda to‘y to‘plamlari uchun osh yeyish yoki kechki payt sahro choyi va pista cheesecakidan bahramand bo‘lish — har bir lahza unutilmas.',
      quote: '“Osh mazzasi juda boy va shirin keladi, shahar bo‘yicha eng zo‘r cheesecakelardan biri.”',
      quoteAuthor: 'Peter Lewandowski · Tasdiqlangan sharh',
      visitBadge: 'Sayqalga Tashrif Buyuring',
      hoursTitle: 'Ish Vaqti va Imkoniyatlar',
      locationLabel: 'Manzil',
      cityState: 'Toshkent, O‘zbekiston',
      hoursLabel: 'Ish Vaqti',
      hoursDesc: 'Dushanba – Yakshanba · 11:00 – 23:30',
      formatsLabel: 'Xizmat Turlari',
      formatsValue: 'Zalda o‘tirish · Olib ketish · Yetkazib berish',
      deskLabel: 'To‘g‘ridan-to‘g‘ri telefon',
      bookBtn: 'Hovlidan Stol Band Qilish',
    },
    gallerySection: {
      badge: 'Sayqal Galereyasi',
      heading: 'Atmosfera va Taomlar Manzarasi',
      subheading: 'Kandillar yog‘duzidagi zallarimiz, archali hovli va yangi tayyorlangan milliy taomlar.',
      tabAll: 'Barchasi',
      tabFood: 'Taomlar',
      tabVibe: 'Atmosfera',
      tabMenu: 'Zal va Stol',
    },
    reviewsSection: {
      badge: 'Mehmonlar Fikri',
      heading: 'Tashrif Buyurganlarning Baholari',
      subheading: '273 ta haqiqiy sharhlar asosida yuqori sifat va samimiy mehmondo‘stlik.',
      verifiedReview: 'Tasdiqlangan mehmon sharhi',
      summaryTitle: 'Reyting Xulosasi',
      ratingBreakdown: '5 yulduzli baholar statistikasi',
    },
    reservationSection: {
      badge: 'Stol Band Qilish',
      heading: 'Oila Davrasida Joy Band Qiling',
      subheading: 'Ism, sana, vaqt va mehmonlar sonini kiriting. Menejer tez orada tasdiqlaydi.',
      nameLabel: 'Ism va Familiya',
      phoneLabel: 'Telefon raqam',
      dateLabel: 'Sana',
      timeLabel: 'Vaqt',
      partyLabel: 'Mehmonlar soni',
      requestsLabel: 'Maxsus istaklar (ixtiyoriy)',
      submitBtn: 'Bron So‘rovini Yuborish',
      successTitle: 'Bron Muvaffaqiyatli Yuborildi!',
      successMessage: 'Tez orada operatorimiz siz bilan bog‘lanib stolni tasdiqlaydi.',
    },
  },
  ru: {
    nav: {
      home: 'Главная',
      menu: 'Меню',
      gallery: 'Галерея',
      events: 'События',
      about: 'О нас',
      contact: 'Контакты',
      reserveBtn: 'Бронировать',
    },
    hero: {
      badge: 'Premium Restaurant',
      subtitle: 'FAMILY RESTAURANT',
      tagline: 'Вкус, эстетика и уют в одном месте...',
      feat1: 'Премиум блюда',
      feat2: 'Современный интерьер',
      feat3: 'Уют для семьи',
      feat4: 'Высокое качество',
      ctaMenu: 'Открыть меню',
      ctaVideo: 'Смотреть видео',
      scrollHint: 'Листайте вниз',
      cards: [
        { id: 'c1', title: 'Изысканные блюда', subtitle: 'Лучшие рецепты', target: 'menu' },
        { id: 'c2', title: 'Атмосфера', subtitle: 'Элегантный зал', target: 'gallery' },
        { id: 'c3', title: 'Десерты', subtitle: 'Сладкое удовольствие', target: 'desserts' },
        { id: 'c4', title: 'Мероприятия', subtitle: 'Незабываемые вечера', target: 'events' },
      ],
    },
    ai: {
      title: 'Gusto AI',
      status: 'Online',
      greeting: 'Здравствуйте! Чем могу помочь вам сегодня?',
      chips: ['О меню', 'Бронь стола', 'О ресторане', 'Другой вопрос'],
      placeholder: 'Напишите сообщение...',
      launcherSub: 'Онлайн помощник',
    },
    guestOrder: {
      title: 'Sayqal Заказ со стола',
      subtitle: 'Заказывайте напрямую — все цены в сумах (UZS)',
      tableLabel: 'Номер стола',
      takeaway: 'С собой',
      orderNow: 'Оформить заказ',
      myOrders: 'Мои заказы',
      cancelOrder: 'Отменить заказ',
      cancelledByGuest: 'Отменено гостем',
      noOrdersYet: 'Заказов пока нет. Выберите блюда из меню.',
      totalLabel: 'Итого',
      pastOrders: 'История прошлых заказов (Past Orders)',
      noPastOrders: 'История завершенных заказов пуста.',
    },
    staff: {
      loginTitle: 'Внутренняя программа Sayqal',
      loginSubtitle: 'Введите код доступа для управления заказами, столами и кассой.',
      passwordLabel: 'Пароль менеджера',
      unlockBtn: 'Войти в систему',
      tabs: {
        orders: 'Живые заказы',
        accounting: 'Приход-Расход & AI',
        dashboard: 'Сводка',
        tablesQr: 'Столы & QR/NFC',
        menu: 'Меню',
        reservations: 'Брони',
        reviews: 'Отзывы',
      },
    },
    menuSection: {
      badge: 'Электронное меню Sayqal · Зргарлик 9',
      heading: 'Меню и Цены',
      subheading: 'Аутентичные узбекские блюда, гриль, салаты и десерты с актуальными ценами в UZS — через NFC или QR-код.',
      searchPlaceholder: 'Поиск блюд...',
      noDishes: 'Блюда не найдены',
      showAll: 'Показать все блюда',
      orderBased: 'Под заказ',
      addBtn: 'Добавить',
      nfcBtn: 'NFC Меню',
      qrBtn: 'QR и NFC Настройка',
    },
    aboutSection: {
      badge: 'Наша история',
      heading: 'Семейные традиции в сердце Ташкента',
      p1: 'Sayqal вдохновлен гладкостью речного камня и традиционной чустской чеканкой. Каждое утро начинается с замачивания отборного риса девзира, тончайшего теста для сомсы и растопки саксаула под мангалом.',
      p2: 'Будь то праздничный свадебный плов в нашем внутреннем дворе или вечерний ароматный чай с фисташковым чизкейком — каждый визит оставляет теплые воспоминания.',
      quote: '«Плов невероятно насыщенный и ароматный, а чизкейк — один из лучших в городе».',
      quoteAuthor: 'Peter Lewandowski · Проверенный отзыв',
      visitBadge: 'Посетите Sayqal',
      hoursTitle: 'Часы работы и условия',
      locationLabel: 'Адрес',
      cityState: 'Ташкент, Узбекистан',
      hoursLabel: 'Режим работы',
      hoursDesc: 'Понедельник – Воскресенье · 11:00 – 23:30',
      formatsLabel: 'Форматы обслуживания',
      formatsValue: 'В зале · На вынос · Доставка',
      deskLabel: 'Телефон ресторана',
      bookBtn: 'Забронировать столик',
    },
    gallerySection: {
      badge: 'Галерея Sayqal',
      heading: 'Атмосфера и Интерьер',
      subheading: 'Изысканные золотые люстры, арочные залы и авторская подача блюд.',
      tabAll: 'Все',
      tabFood: 'Блюда',
      tabVibe: 'Атмосфера',
      tabMenu: 'Зал',
    },
    reviewsSection: {
      badge: 'Отзывы гостей',
      heading: 'Что говорят наши гости',
      subheading: 'Высокое качество и искреннее гостеприимство на основе 273 отзывов.',
      verifiedReview: 'Проверенный отзыв гостя',
      summaryTitle: 'Сводка рейтинга',
      ratingBreakdown: 'Распределение оценок 5–1 звезд',
    },
    reservationSection: {
      badge: 'Бронирование столика',
      heading: 'Зарезервируйте стол для вашей семьи',
      subheading: 'Укажите имя, дату, время и количество гостей. Менеджер подтвердит бронь.',
      nameLabel: 'Имя и фамилия',
      phoneLabel: 'Номер телефона',
      dateLabel: 'Дата',
      timeLabel: 'Время',
      partyLabel: 'Количество гостей',
      requestsLabel: 'Особые пожелания (необязательно)',
      submitBtn: 'Отправить заявку на бронь',
      successTitle: 'Бронирование отправлено!',
      successMessage: 'Наш администратор свяжется с вами в ближайшее время для подтверждения.',
    },
  },
  en: {
    nav: {
      home: 'Home',
      menu: 'Menu',
      gallery: 'Gallery',
      events: 'Events',
      about: 'About',
      contact: 'Contact',
      reserveBtn: 'Reserve Table',
    },
    hero: {
      badge: 'Premium Restaurant',
      subtitle: 'FAMILY RESTAURANT',
      tagline: 'Taste, elegance, and warmth in one place...',
      feat1: 'Signature Dishes',
      feat2: 'Modern Salon',
      feat3: 'Family Hospitality',
      feat4: 'Craft Quality',
      ctaMenu: 'Explore Menu',
      ctaVideo: 'Watch Tour',
      scrollHint: 'Scroll down',
      cards: [
        { id: 'c1', title: 'Signature Dishes', subtitle: 'Crafted Uzbek cuisine', target: 'menu' },
        { id: 'c2', title: 'Modern Salon', subtitle: 'Candlelit atmosphere', target: 'gallery' },
        { id: 'c3', title: 'Desserts', subtitle: 'Artisan patisserie', target: 'desserts' },
        { id: 'c4', title: 'Private Events', subtitle: 'Unforgettable evenings', target: 'events' },
      ],
    },
    ai: {
      title: 'Gusto AI',
      status: 'Online',
      greeting: 'Hello! How may I assist your dining experience today?',
      chips: ['About Menu', 'Book a Table', 'Restaurant Info', 'Other Question'],
      placeholder: 'Type a message...',
      launcherSub: 'Online Concierge',
    },
    guestOrder: {
      title: 'Sayqal Table Ordering',
      subtitle: 'Order directly from your table — prices shown in UZS',
      tableLabel: 'Table Number',
      takeaway: 'Takeaway',
      orderNow: 'Place Order',
      myOrders: 'My Orders',
      cancelOrder: 'Cancel Order',
      cancelledByGuest: 'Cancelled by guest',
      noOrdersYet: 'No orders placed yet. Add dishes from the menu.',
      totalLabel: 'Order Total',
      pastOrders: 'Past Dining History (Previous Orders)',
      noPastOrders: 'No past dining history found.',
    },
    staff: {
      loginTitle: 'Sayqal Internal Restaurant OS',
      loginSubtitle: 'Enter the staff passcode to access live kitchen orders, floor tables, and accounting.',
      passwordLabel: 'Staff Passcode',
      unlockBtn: 'Unlock Restaurant OS',
      tabs: {
        orders: 'Live Orders',
        accounting: 'Accounting & AI',
        dashboard: 'Overview',
        tablesQr: 'Tables & QR/NFC',
        menu: 'Menu Manager',
        reservations: 'Reservations',
        reviews: 'Reviews',
      },
    },
    menuSection: {
      badge: 'Sayqal Electronic Menu · 9 Zargarlik',
      heading: 'Menu & Live Prices',
      subheading: 'Authentic Uzbek, grill, salad, pide & beverage repertoire with live UZS pricing — accessible instantly via table NFC tap or QR scan.',
      searchPlaceholder: 'Search dishes...',
      noDishes: 'No dishes found',
      showAll: 'Show All Dishes',
      orderBased: 'Made to order',
      addBtn: 'Add',
      nfcBtn: 'NFC Electronic Menu',
      qrBtn: 'QR Code & NFC Setup',
    },
    aboutSection: {
      badge: 'Our Heritage',
      heading: 'A Tashkent Table Built Around Family Ritual',
      p1: 'Sayqal takes its name from the gentle polish of river stone and traditional Chust brasswork. Every morning begins with soaked Fergana Devzira rice, mountain greens folded into tissue-thin somsa dough, and saxaul wood kindled beneath our open grill.',
      p2: 'Whether gathering for celebratory wedding plov in our courtyard salon or stopping by for evening saffron choy and pistachio cheesecake, every course honors unhurried Uzbek hospitality.',
      quote: '“The Osh arrives steaming with remarkable depth, and the cheesecake easily one of the best in the city.”',
      quoteAuthor: 'Peter Lewandowski · Verified Guest Review',
      visitBadge: 'Visit Sayqal',
      hoursTitle: 'Hours & Hospitality',
      locationLabel: 'Location',
      cityState: 'Tashkent, Uzbekistan',
      hoursLabel: 'Opening Hours',
      hoursDesc: 'Monday – Sunday · 11:00 – 23:30',
      formatsLabel: 'Dining Formats',
      formatsValue: 'Dine-in · Takeout · Delivery',
      deskLabel: 'Direct Desk',
      bookBtn: 'Book Courtyard Seating',
    },
    gallerySection: {
      badge: 'Sayqal Gallery',
      heading: 'Atmosphere & Culinary Views',
      subheading: 'Candlelit chandeliers, arched salons, and artisanal presentation.',
      tabAll: 'All',
      tabFood: 'Food & Drink',
      tabVibe: 'Atmosphere',
      tabMenu: 'Salon & Tables',
    },
    reviewsSection: {
      badge: 'Guest Reviews',
      heading: 'Trusted Guest Experiences',
      subheading: 'Authentic feedback and high ratings across 273 reviews.',
      verifiedReview: 'Verified Guest Review',
      summaryTitle: 'Rating Summary',
      ratingBreakdown: '5-star rating breakdown',
    },
    reservationSection: {
      badge: 'Table Reservation',
      heading: 'Reserve Your Family Table',
      subheading: 'Enter your name, date, party size, and special requests for a seamless experience.',
      nameLabel: 'Full Name',
      phoneLabel: 'Phone Number',
      dateLabel: 'Date',
      timeLabel: 'Time',
      partyLabel: 'Party Size',
      requestsLabel: 'Special Requests (optional)',
      submitBtn: 'Send Reservation Request',
      successTitle: 'Reservation Successfully Sent!',
      successMessage: 'Our concierge will contact you shortly to confirm your table.',
    },
  },
};
