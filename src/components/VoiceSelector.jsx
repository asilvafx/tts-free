import { useMemo } from 'react'

export default function VoiceSelector({ 
  voices, 
  selectedVoice, 
  selectedLanguage,
  onVoiceChange,
  onLanguageChange
}) {
  const languages = useMemo(() => {
    const langMap = new Map()
    voices.forEach(voice => {
      const lang = voice.lang.split('-')[0]
      const langName = new Intl.DisplayNames(['en'], { type: 'language' }).of(lang)
      langMap.set(lang, langName)
    })
    return Array.from(langMap.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
  }, [voices])

  const filteredVoices = useMemo(() => {
    if (!selectedLanguage) return []
    return voices.filter(voice => voice.lang.startsWith(selectedLanguage))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [selectedLanguage, voices])

  const handleLanguageChange = (e) => {
    const lang = e.target.value
    onLanguageChange(lang)
    onVoiceChange(null)
  }

  const handleVoiceChange = (e) => {
    const voice = voices.find(v => v.name === e.target.value)
    onVoiceChange(voice)
  }

  return (
    <div className="voice-selector">
      <div className="select-group">
        <label htmlFor="language">Language:</label>
        <select
          id="language"
          value={selectedLanguage}
          onChange={handleLanguageChange}
        >
          <option value="">Select Language</option>
          {languages.map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div className="select-group">
        <label htmlFor="voice">Voice:</label>
        <select
          id="voice"
          value={selectedVoice?.name || ''}
          onChange={handleVoiceChange}
          disabled={!selectedLanguage}
        >
          <option value="">Select Voice</option>
          {filteredVoices.map(voice => (
            <option key={voice.name} value={voice.name}>
              {voice.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
