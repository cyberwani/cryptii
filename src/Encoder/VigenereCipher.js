
import Chain from '../Chain'
import Encoder from '../Encoder'
import MathUtil from '../MathUtil'

const meta = {
  name: 'vigenere-cipher',
  title: 'Vigenère cipher',
  category: 'Substitution cipher',
  type: 'encoder'
}

const defaultAlphabet = 'abcdefghijklmnopqrstuvwxyz'

/**
 * Encoder brick for Vigenère cipher encoding and decoding
 */
export default class VigenereCipherEncoder extends Encoder {
  /**
   * Returns brick meta.
   * @return {object}
   */
  static getMeta () {
    return meta
  }

  /**
   * Constructor
   */
  constructor () {
    super()
    this.registerSetting([
      {
        name: 'variant',
        type: 'enum',
        value: 'standard',
        options: {
          elements: [
            'standard',
            'beaufort-cipher',
            'variant-beaufort-cipher'
          ],
          labels: [
            'Standard',
            'Beaufort cipher',
            'Variant Beaufort cipher'
          ]
        }
      },
      {
        name: 'key',
        type: 'text',
        value: 'cryptii',
        options: {
          allowedChars: defaultAlphabet,
          minLength: 2
        }
      },
      {
        name: 'alphabet',
        type: 'alphabet',
        value: defaultAlphabet,
        randomizable: false
      },
      {
        name: 'caseSensitivity',
        type: 'boolean',
        width: 6,
        value: false,
        randomizable: false
      },
      {
        name: 'includeForeignChars',
        type: 'boolean',
        label: 'Foreign Chars',
        width: 6,
        value: true,
        randomizable: false,
        options: {
          trueLabel: 'Include',
          falseLabel: 'Ignore'
        }
      }
    ])
  }

  /**
   * Performs encode or decode on given content.
   * @param {Chain} content
   * @param {boolean} isEncode True for encoding, false for decoding
   * @return {Chain|Promise} Resulting content
   */
  performTranslate (content, isEncode) {
    const { alphabet, variant, key, includeForeignChars } =
      this.getSettingValues()

    // handle case sensitivity
    if (!this.getSettingValue('caseSensitivity')) {
      content = content.toLowerCase()
    }

    let j = 0
    let resultCodePoints = []
    let charIndex, codePoint, keyCodePoint, keyIndex

    // translate each character
    for (let i = 0; i < content.getLength(); i++) {
      codePoint = content.getCodePointAt(i)
      charIndex = alphabet.indexOfCodePoint(codePoint)

      if (charIndex !== -1) {
        // calculate shift from key
        keyCodePoint = key.getCodePointAt(MathUtil.mod(j, key.getLength()))
        keyIndex = alphabet.indexOfCodePoint(keyCodePoint)

        // shift char index depending on variant
        switch (variant) {
          case 'beaufort-cipher':
            charIndex = keyIndex - charIndex
            break
          case 'variant-beaufort-cipher':
            charIndex = isEncode
              ? charIndex - keyIndex
              : charIndex + keyIndex
            break
          default:
            charIndex = isEncode
              ? charIndex + keyIndex
              : charIndex - keyIndex
        }

        // match code point to shifted char index and add it to result
        charIndex = MathUtil.mod(charIndex, alphabet.getLength())
        codePoint = alphabet.getCodePointAt(charIndex)
        resultCodePoints.push(codePoint)
        j++
      } else if (includeForeignChars) {
        // add foreign character to result
        resultCodePoints.push(codePoint)
      }
    }

    return Chain.wrap(resultCodePoints)
  }

  /**
   * Triggered when a setting value has changed.
   * @protected
   * @param {Setting} setting
   * @param {mixed} value Setting value
   * @return {Encoder} Fluent interface
   */
  settingValueDidChange (setting, value) {
    switch (setting.getName()) {
      case 'alphabet':
        // update allowed chars of key setting
        this.getSetting('key').setAllowedChars(value)
        break
      case 'caseSensitivity':
        // also set case sensitivity on alphabet and key setting
        this.getSetting('alphabet').setCaseSensitivity(value)
        this.getSetting('key').setCaseSensitivity(value)
        break
    }
    return super.settingValueDidChange(setting, value)
  }
}
