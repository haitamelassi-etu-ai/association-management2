import { Check, ChevronDown, Globe2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

const languages = [
  { code: 'fr', name: 'Français', short: 'FR', dir: 'ltr' },
  { code: 'ar', name: 'العربية', short: 'AR', dir: 'rtl' },
  { code: 'en', name: 'English', short: 'EN', dir: 'ltr' }
];

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (langCode, direction) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('language', langCode);
    document.documentElement.setAttribute('dir', direction);
    document.documentElement.setAttribute('lang', langCode);
  };

  const currentLang = languages.find((lang) => lang.code === i18n.language) || languages[0];

  return (
    <div className="language-switcher">
      <button className="lang-button" title="Changer la langue" type="button">
        <Globe2 size={16} />
        <span className="lang-code">{currentLang.short}</span>
        <ChevronDown size={14} />
      </button>
      <div className="lang-dropdown">
        {languages.map((lang) => (
          <button
            key={lang.code}
            className={`lang-option ${i18n.language === lang.code ? 'active' : ''}`}
            onClick={() => changeLanguage(lang.code, lang.dir)}
            type="button"
          >
            <span className="lang-code">{lang.short}</span>
            <span className="lang-name">{lang.name}</span>
            {i18n.language === lang.code && <Check size={15} />}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSwitcher;
