import Header from '../components/Header'
import About from '../components/About'
import Skills from '../components/Skills'
import Projects from '../components/Projects'
import Footer from '../components/Footer'

function Home() {
  const skills = [
    'HTML5', 'CSS3', 'Bootstrap',
    'JavaScript', 'React.js', 'Node.js',
    'Git & GitHub', 'Java',
  ]

  return (
    <div className="page">
      <Header name="Rushil Nariya" themeColor="#0d6efd" />
      <About bio="I am passionate about Web Development and React.js. I enjoy building responsive websites and learning new technologies. My goal is to become a Full Stack Developer." />
      <Skills skillList={skills} />
      <Projects />
      <Footer contact="rushilnariya@gmail.com" />
    </div>
  )
}

export default Home