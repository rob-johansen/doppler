import doppler from './server'

const PORT = 3000

doppler.listen(PORT, () => {
  console.log(`Doppler tokenization service listening on port ${PORT}`)
})
