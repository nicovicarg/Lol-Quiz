import { useState, useEffect } from 'react'
import './App.css'
import champions from './assets/champions_min.json'

// --- FUNCIONES DE LIMPIEZA Y SIMILITUD ---

function cleanText(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
}

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

function calculateSimilarity(input, target) {
  const cleanInput = cleanText(input)
  const cleanTarget = cleanText(target)

  if (!cleanInput) return 0
  if (cleanInput === cleanTarget) return 1

  const distance = levenshteinDistance(cleanInput, cleanTarget)
  const maxLength = Math.max(cleanInput.length, cleanTarget.length)

  const similarity = (maxLength - distance) / maxLength
  return Math.max(0, similarity)
}

// --- COMPONENTE PARA DIBUJAR COMPARACIÓN DE LETRAS ---
function LetterComparison({ targetName, inputName }) {
  const cleanTarget = cleanText(targetName)
  const cleanInput = cleanText(inputName)

  const maxLength = Math.max(cleanTarget.length, cleanInput.length)
  const result = []

  for (let i = 0; i < maxLength; i++) {
    const targetChar = cleanTarget[i] || ''
    const inputChar = cleanInput[i] || ''

    if (i < cleanInput.length) {
      if (inputChar === targetChar) {
        // Letra correcta
        result.push({ char: inputChar, status: 'correct' })
      } else {
        // Letra equivocada
        result.push({ char: inputChar, status: 'wrong' })
      }
    } else {
      // Letra faltante
      result.push({ char: '-', status: 'missing' })
    }
  }

  return (
    <div style={{ marginTop: '15px', marginBottom: '15px' }}>
      <p style={{ margin: '5px 0', fontSize: '0.9rem', color: '#aaa' }}>
        Esperado: <strong style={{ color: '#fff', fontSize: '1.1rem' }}>{targetName}</strong>
      </p>
      <p style={{ margin: '5px 0', fontSize: '0.9rem', color: '#aaa' }}>Tu respuesta:</p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', fontSize: '1.5rem', fontWeight: 'bold' }}>
        {result.map((item, index) => {
          let color = '#fff'
          if (item.status === 'correct') color = '#4CAF50' // Verde
          if (item.status === 'wrong') color = '#F44336'   // Rojo
          if (item.status === 'missing') color = '#888'    // Gris para faltantes

          return (
            <span 
              key={index} 
              style={{ 
                color: color, 
                borderBottom: `2px solid ${color}`, 
                padding: '0 4px',
                minWidth: '16px',
                textAlign: 'center'
              }}
            >
              {item.char}
            </span>
          )
        })}
      </div>
    </div>
  )
}

// --- COMPONENTE PRINCIPAL ---

function App() {
  const [fase, setFase] = useState('estudio')
  const [estudioChampions, setEstudioChampions] = useState([])
  const [estudioIndex, setEstudioIndex] = useState(0)

  const [quizChampions, setQuizChampions] = useState([])
  const [quizIndex, setQuizIndex] = useState(0)

  const [userAnswer, setUserAnswer] = useState('')
  const [score, setScore] = useState(0)
  
  // Estado para la retroalimentación intermedia
  const [showFeedback, setShowFeedback] = useState(false)
  const [lastSubmittedAnswer, setLastSubmittedAnswer] = useState('')

  const maxPointsPerChampion = 100 / champions.length

  useEffect(() => {
    const shuffled = [...champions].sort(() => Math.random() - 0.5)
    setEstudioChampions(shuffled)
  }, [])

  const handleNextEstudio = () => {
    if (estudioIndex < estudioChampions.length - 1) {
      setEstudioIndex((prev) => prev + 1)
    }
  }

  const handleStartQuiz = () => {
    const shuffled = [...champions].sort(() => Math.random() - 0.5)
    setQuizChampions(shuffled)
    setQuizIndex(0)
    setScore(0)
    setUserAnswer('')
    setShowFeedback(false)
    setLastSubmittedAnswer('')
    setFase('quiz')
  }

  // Al hacer submit en el form
  const handleSubmitAnswer = (e) => {
    e.preventDefault()
    if (showFeedback) return

    const currentChampion = quizChampions[quizIndex]
    const accuracy = calculateSimilarity(userAnswer, currentChampion.name)
    const pointsEarned = accuracy * maxPointsPerChampion
    
    setScore((prev) => prev + pointsEarned)
    setLastSubmittedAnswer(userAnswer)
    setShowFeedback(true)
  }

  // Al presionar "Siguiente Campeón"
  const handleNextQuestion = () => {
    setUserAnswer('')
    setShowFeedback(false)
    setQuizIndex((prev) => prev + 1)
  }

  // --- RENDER: MODO QUIZ ---
  if (fase === 'quiz') {
    const currentQuiz = quizChampions[quizIndex]

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

    const accuracyPercent = (calculateSimilarity(lastSubmittedAnswer, currentQuiz.name) * 100).toFixed(0)

    return (
      <div style={{ textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
        <h3>Quiz ({quizIndex + 1} / {quizChampions.length})</h3>
        <p>Puntaje acumulado: <strong>{score.toFixed(2)} pts</strong></p>
        
        <div>
          <img 
            src={`/loading/${currentQuiz.image}`} 
            alt="Campeón misterioso" 
            style={{ maxHeight: '300px', borderRadius: '8px' }}
          />
        </div>

        {!showFeedback ? (
          <form onSubmit={handleSubmitAnswer} style={{ marginTop: '15px' }}>
            <input 
              type="text" 
              placeholder="Nombre del campeón..." 
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              autoFocus
              style={{ padding: '8px', fontSize: '1rem', borderRadius: '4px' }}
            />
            <button type="submit" style={{ marginLeft: '8px', padding: '8px 16px' }}>
              Enviar
            </button>
          </form>
        ) : (
          <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#222', borderRadius: '8px' }}>
            <LetterComparison 
              targetName={currentQuiz.name} 
              inputName={lastSubmittedAnswer} 
            />
            <p style={{ fontSize: '0.9rem', color: '#ddd' }}>
              Acierto en esta respuesta: <strong>{accuracyPercent}%</strong>
            </p>
            <button 
              onClick={handleNextQuestion} 
              autoFocus
              style={{ padding: '10px 20px', fontSize: '1rem', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Siguiente Campeón ➔
            </button>
          </div>
        )}
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
