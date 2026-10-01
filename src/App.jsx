import { useState, useEffect } from 'react'
import './App.css'
import champions from './assets/champions_min.json'

// --- FUNCIONES DE LIMPIEZA Y EVALUACIÓN DE RESPUESTA ---

function cleanText(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
}

function evaluateAnswer(targetName, inputName) {
  const cleanTarget = cleanText(targetName)
  const cleanInput = cleanText(inputName)

  if (!cleanInput) {
    return {
      accuracy: 0,
      details: Array.from(cleanTarget).map(() => ({ char: '-', status: 'missing' }))
    }
  }

  const maxLength = Math.max(cleanTarget.length, cleanInput.length)
  const details = []
  let correctMatches = 0

  for (let i = 0; i < maxLength; i++) {
    const targetChar = cleanTarget[i] || ''
    const inputChar = cleanInput[i] || ''

    if (i < cleanInput.length) {
      if (inputChar === targetChar && targetChar !== '') {
        correctMatches++
        details.push({ char: inputChar, status: 'correct' })
      } else {
        details.push({ char: inputChar, status: 'wrong' })
      }
    } else {
      details.push({ char: '-', status: 'missing' })
    }
  }

  // CORRECCIÓN: Se divide entre maxLength para penalizar letras extra o mal puestas
  const accuracy = correctMatches / maxLength

  return { accuracy, details }
}

// --- COMPONENTE PARA DIBUJAR COMPARACIÓN DE LETRAS ---
function LetterComparison({ targetName, details }) {
  return (
    <div style={{ marginTop: '15px', marginBottom: '15px' }}>
      <p style={{ margin: '5px 0', fontSize: '0.9rem', color: '#aaa' }}>
        Esperado: <strong style={{ color: '#fff', fontSize: '1.1rem' }}>{targetName}</strong>
      </p>
      <p style={{ margin: '5px 0', fontSize: '0.9rem', color: '#aaa' }}>Tu respuesta:</p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', fontSize: '1.5rem', fontWeight: 'bold' }}>
        {details.map((item, index) => {
          let color = '#fff'
          if (item.status === 'correct') color = '#4CAF50'
          if (item.status === 'wrong') color = '#F44336'
          if (item.status === 'missing') color = '#888'

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
  
  const [showFeedback, setShowFeedback] = useState(false)
  const [evaluation, setEvaluation] = useState({ accuracy: 0, details: [] })

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
    setFase('quiz')
  }

  const handleSubmitAnswer = (e) => {
    e.preventDefault()
    if (showFeedback) return

    const currentChampion = quizChampions[quizIndex]
    const result = evaluateAnswer(currentChampion.name, userAnswer)
    const pointsEarned = result.accuracy * maxPointsPerChampion
    
    setScore((prev) => prev + pointsEarned)
    setEvaluation(result)
    setShowFeedback(true)
  }

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
              details={evaluation.details} 
            />
            <p style={{ fontSize: '0.9rem', color: '#ddd' }}>
              Acierto en esta respuesta: <strong>{(evaluation.accuracy * 100).toFixed(0)}%</strong>
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
      
      <div style={{ marginBottom: '15px' }}>
        <button 
          onClick={handleStartQuiz} 
          style={{ padding: '8px 16px', backgroundColor: '#ff9800', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          ⚡ Saltar al Quiz
        </button>
      </div>

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
