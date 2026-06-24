import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`

export async function extractTextFromPDF(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = async (e) => {
      try {
        const typedArray = new Uint8Array(e.target.result)

        const pdf = await pdfjsLib.getDocument({
          data: typedArray,
          useWorkerFetch: false,
          isEvalSupported: false,
          useSystemFonts: true
        }).promise

        let fullText = ''

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const textContent = await page.getTextContent()
          const pageText = textContent.items
            .map(item => item.str)
            .join(' ')
          fullText += pageText + '\n'
        }

        resolve(fullText.trim())
      } catch (err) {
        reject(err)
      }
    }

    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}