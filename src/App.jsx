import { useState, useEffect } from 'react'
import './App.css'
import champions from './assets/champions_min.json'

// --- FUNCIÓN DE LIMPIEZA Y SIMILITUD ---

// Normaliza texto: pasa a minúsculas y quita acentos y caracteres especiales (apóstrofes, puntos, etc.)
function cleanText(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remueve acentos
    .replace(/[^a-z0-9]/g, "")      // Deja solo letras y números
}

// Algoritmo para calcular la distancia de Levenshtein (diferencia de caracteres)
function levenshteinDistance(a, b) {
  const matrix = []
  for (let i = 0; i <= b.length; i++) matrix[i] = [i]
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  return matrix[b.length][a.length]
}

// Calcula la similitud de 0.0 a 1.0 entre la respuesta dada y el nombre correcto
function calculateSimilarity(input, target) {
  const cleanInput = cleanText(input)
  const cleanTarget = cleanText(target)

  if (!cleanInput) return 0
  if (cleanInput === cleanTarget) return 1

  const distance = levenshteinDistance(cleanInput, cleanTarget)
  const maxLength = Math.max(cleanInput.length, cleanTarget.length)

  const similarity = (maxLength - distance) / maxLength
  return Math.max(0, similarity) // Retorna entre 0 y 1
}


// --- COMPONENTE PRINCIPAL ---

function App() {
  const [fase, setFase] = useState('estudio')
  const [estudioChampions, setEstudioChampions] = useState([])
  const [estudioIndex, setEstudioIndex] = useState(0)

  const [quizChampions, setQuizChampions] = useState([])
  const [quizIndex, setQuizIndex] = useState(0)

  // Estados para el Quiz y el Score
  const [userAnswer, setUserAnswer] = useState('')
  const [score, setScore] = useState(0)
  const [lastAccuracy, setLastAccuracy] = useState(null) // Para mostrar retroalimentación en pantalla

  const maxPointsPerChampion = 100 / champions.length

  // Preparamos la lista desordenada para Modo Estudio
  useEffect(() => {
    const shuffled = [...champions].sort(() => Math.random() - 0.5)
    setEstudioChampions(shuffled)
  }, [])

  // Avanza al siguiente en Modo Estudio
  const handleNextEstudio = () => {
    if (estudioIndex < estudioChampions.length - 1) {
      setEstudioIndex((prev) => prev + 1)
    }
  }

  // Iniciar Quiz
  const handleStartQuiz = () => {
    const shuffled = [...champions].sort(() => Math.random() - 0.5)
    setQuizChampions(shuffled)
    setQuizIndex(0)
    setScore(0)
    setUserAnswer('')
    setLastAccuracy(null)
    setFase('quiz')
  }

  // Procesar respuesta del Quiz
  const handleNextQuiz = (e) => {
    e.preventDefault()

    const currentChampion = quizChampions[quizIndex]
    
    // Calcular porcentaje de acierto para este campeón (de 0 a 1)
    const accuracy = calculateSimilarity(userAnswer, currentChampion.name)
    
    // Sumar los puntos obtenidos proporcionalmente
    const pointsEarned = accuracy * maxPointsPerChampion
    setScore((prevScore) => prevScore + pointsEarned)

    // Opcional: Mostrar feedback breve antes de avanzar o avanzar directo
    setUserAnswer('')
    setQuizIndex((prev) => prev + 1)
  }


  // --- RENDER: MODO QUIZ ---
  if (fase === 'quiz') {
    const currentQuiz = quizChampions[quizIndex]

    // PANTALLA FINAL DEL QUIZ
    if (!currentQuiz) {
      return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <h2>¡Quiz terminado! 🎉</h2>
          <h3>Puntaje Final:</h3>
          <h1 style={{ fontSize: '3rem', color: '#4CAF50' }}>
            {score.toFixed(2)} / 100 pts
          </h1>
          <p>
            Porcentaje de acierto global: {((score / 100) * 100).toFixed(1)}%
          </p>
          <button onClick={() => {
            setEstudioIndex(0)
            setFase('estudio')
          }}>
            Volver a estudiar
          </button>
        </div>
      )
    }

    return (
      <div style={{ textAlign: 'center' }}>
        <h3>Quiz ({quizIndex + 1} / {quizChampions.length})</h3>
        <p>Puntaje acumulado: <strong>{score.toFixed(2)} pts</strong></p>
        
        <div>
          <img 
            src={`/loading/${currentQuiz.image}`} 
            alt="Campeón misterioso" 
            style={{ maxHeight: '350px', borderRadius: '8px' }}
          />
        </div>

        <form onSubmit={handleNextQuiz} style={{ marginTop: '15px' }}>
          <input 
            type="text" 
            placeholder="Nombre del campeón..." 
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            autoFocus
          />
          <button type="submit">Enviar</button>
        </form>
      </div>
    )
  }


  // --- RENDER: MODO ESTUDIO ---
  const currentEstudio = estudioChampions[estudioIndex]
  const isLastChampion = estudioIndex === estudioChampions.length - 1

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>Modo Estudio ({estudioIndex + 1} / {estudioChampions.length})</h2>
      
      {currentEstudio && (
        <div style={{ cursor: 'pointer' }} onClick={handleNextEstudio}>
          <h3>{currentEstudio.name}</h3>
          <img 
            src={`/loading/${currentEstudio.image}`} 
            alt={currentEstudio.name} 
            style={{ maxHeight: '350px', borderRadius: '8px' }}
          />
          {!isLastChampion && <p><i>(Haz clic en la imagen para ver el siguiente)</i></p>}
        </div>
      )}

      {isLastChampion && (
        <button onClick={handleStartQuiz} style={{ marginTop: '20px', padding: '10px 20px', fontSize: '1.1rem' }}>
          ¡Estoy listo para el Quiz!
        </button>
      )}
    </div>
  )
}

export default App

