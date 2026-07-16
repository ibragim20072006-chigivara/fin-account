// Выбор провайдера распознавания. По умолчанию Gemini; GigaChat — через RECOGNIZE_PROVIDER=gigachat.
import { recognize as gigachatRecognize, gigachatConfigured } from './gigachat.js'
import { recognize as geminiRecognize, geminiConfigured } from './gemini.js'

const useGigachat = () => (process.env.RECOGNIZE_PROVIDER || 'gemini').toLowerCase() === 'gigachat'

export const recognizeConfigured = () => (useGigachat() ? gigachatConfigured() : geminiConfigured())

export const recognize = (buffer, mime, categories) =>
  (useGigachat() ? gigachatRecognize : geminiRecognize)(buffer, mime, categories)
