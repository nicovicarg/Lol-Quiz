import { useState } from 'react'
import './App.css'
import champions from './assets/champions_min.json'

function App() {
  const [fase, setFase] = useState('estudio')
  const [quizChampions, setQuizChampions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)

  // Función para iniciar el modo quiz y desordenar la lista
  const handleStartQuiz = () => {
    // Copiamos el array y lo desordenamos (algoritmo de ordenación aleatoria)
    const shuffled = [...champions].sort(() => Math.random() - 0.5)
    setQuizChampions(shuffled)
    setCurrentIndex(0)
    setFase('quiz')
  }

  // Avanzar al siguiente campeón
  const handleNext = (e) => {
    e.preventDefault()
    setCurrentIndex((prevIndex) => prevIndex + 1)
  }

  // Render para el modo Quiz
  if (fase === "quiz") {
    const currentChampion = quizChampions[currentIndex]

    // Si ya pasamos por todos los campeones
    if (!currentChampion) {
      return (
        <div>
          <h2>¡Quiz terminado!</h2>
          <button onClick={() => setFase("estudio")}>Volver a estudiar</button>
        </div>
      )
    }

    return (
      <div>
        <h3>Quiz ({currentIndex + 1} / {quizChampions.length})</h3>
        <div>
          <img src={`/loading/${currentChampion.image}`} alt="Campeón misterioso" />
        </div>
        <form onSubmit={handleNext}>
          <input type="text" placeholder="Nombre del campeón..." />
          <button type="submit">Enviar</button>
        </form>
      </div>
    )
  }

  // Render para el modo Estudio
  return (
    <>
      <div>
        {champions.map((c) => (
          <div key={c.id}>
            <li>{c.name}</li>
            <img src={`/loading/${c.image}`} alt={c.name} />
          </div>
        ))}
      </div>
      <button onClick={handleStartQuiz}>Estoy listo</button>
    </>
  )
}

export default App
