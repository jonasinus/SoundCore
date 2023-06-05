import { useState, useRef, useEffect } from 'react'
import { userConfig } from '../App'
import { Chapter, Stream } from '../api/Client'

interface PlayerProps {
    next: () => void
    currentlyPlaying: Stream | undefined
    src: string
}

export default function Player(props: PlayerProps) {
    const audioElement = useRef<HTMLAudioElement | null>(null)
    const [playing, setPlaying] = useState(false)
    const [progres, setProgres] = useState(0)

    const [isLooped, setIsLooped] = useState(false)
    const loopRef = useRef<{ position: number; duration: number } | null>(null) // Store loop position and duration

    const [isSwipedUp, setIsSwipedUp] = useState(true)
    const [startY, setStartY] = useState(0)
    const [offsetY, setOffsetY] = useState(0)
    const playerRef = useRef<HTMLDivElement>(null)

    const [currentChapter, setCurrentChapter] = useState<Chapter>()

    const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
        const touch = event.touches[0]
        setStartY(touch.pageY)
    }

    const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
        const touch = event.touches[0]
        const currentY = touch.pageY
        const delta = currentY - startY

        setOffsetY(delta)
    }

    const handleTouchEnd = () => {
        if (offsetY < -50) {
            setIsSwipedUp(true)
        } else {
            setIsSwipedUp(false)
        }
        setOffsetY(0)
    }

    function timeloop(position: number, duration: number) {
        console.log(
            `requesting loop from ${position}s for ${duration * 1000}ms. audioTrack is at ${
                audioElement.current?.currentTime
            }`
        )
        // Check if audio element reference is available
        if (!audioElement.current) {
            console.error('Audio element reference not available')
            return
        }

        const audio = audioElement.current

        // Check if position is within the track bounds
        if (position < 0 || position >= audio.duration) {
            console.error('Invalid position')
            return
        }

        // Check if loop duration is too long
        if (duration <= 0 || position + duration > audio.duration) {
            console.error('Invalid loop duration')
            return
        }

        // Set loop position and duration
        loopRef.current = { position, duration }

        // Start playing the audio
        audio.currentTime = position
        audio.play()

        // Set isLooped to true
        setIsLooped(true)
    }

    useEffect(() => {
        // Add the timeupdate event listener to handle looping
        const handleTimeUpdate = () => {
            if (isLooped && loopRef.current && audioElement.current) {
                const { position, duration } = loopRef.current

                const audio = audioElement.current
                const currentTime = audio.currentTime

                // Check if the current playback position exceeds the loop end time
                if (currentTime >= position + duration) {
                    console.log(`looping back from ${currentTime} to ${position}`)
                    // Update the playback position to the loop start time
                    audio.currentTime = position
                }
            }
        }

        if (audioElement.current) {
            audioElement.current.addEventListener('timeupdate', handleTimeUpdate)
        }

        console.log('isLooping updated: ', isLooped)

        return () => {
            if (audioElement.current) {
                audioElement.current.removeEventListener('timeupdate', handleTimeUpdate)
            }
        }
    }, [isLooped])

    const handleProgress = (event: React.SyntheticEvent<HTMLAudioElement>) => {
        const audioElement = event.currentTarget
        const currentTime = audioElement.currentTime
        setProgres(audioElement.currentTime)
        setCurrentChapter(getChapter(currentTime))
        if (currentTime >= audioElement.duration - 1) {
            alert('song has ended!')
            props.next()
        }
    }

    const handleSeekTo = (event: React.MouseEvent) => {
        const x = event.clientX
        let toSecond = (x / event.currentTarget.clientWidth) * (audioElement.current?.duration || 1)
        audioElement.current!.currentTime = toSecond
    }

    function getChapter(currentTime: number): Chapter {
        let currentChapter: Chapter = {
            start: 0,
            title: 'no chapters in this stream',
            image: ''
        }
        if (props.currentlyPlaying && props.currentlyPlaying.chapters.length > 0) {
            let chapters: Chapter[] = props.currentlyPlaying.chapters
            chapters.forEach((e) => {
                if (currentTime - e.start >= 0) currentChapter = e
            })
        }
        return currentChapter
    }

    return (
        <div
            className={`player ${isSwipedUp ? 'swiped-up' : ''} ${
                audioElement.current && audioElement.current.src && audioElement.current.src !== ''
                    ? 'track-loaded'
                    : 'no-track-loaded'
            }`}
            //style={{ bottom: isSwipedUp ? 'calc(90vh - 1px)' : 0 }}
            ref={playerRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}>
            {true ? (
                <audio
                    controls
                    onTimeUpdate={handleProgress}
                    ref={audioElement}
                    hidden
                    src={props.src}
                    onCanPlay={(e) => {
                        if (userConfig.autoStart) {
                            e.currentTarget.play()
                            setPlaying(true)
                        }
                        return true
                    }}></audio>
            ) : (
                <video controls onTimeUpdate={handleProgress} hidden>
                    <source src={props.src} type='video/mp4'></source>
                </video>
            )}
            <div className='progress-bar-wrapper' onClick={(e) => handleSeekTo(e)}>
                <div
                    className='progres'
                    style={{
                        width: `calc(${(progres / (audioElement.current?.duration || 1)) * 100}%)`
                    }}>
                    <div className='point'></div>
                </div>
            </div>
            <div className='ctrls'>
                <button onClick={() => setIsSwipedUp(!isSwipedUp)}>{isSwipedUp ? '↓' : '↑'}</button>
                <button>&lt;</button>
                <button
                    onClick={() => {
                        if (audioElement.current) {
                            audioElement.current.currentTime -= 5
                        }
                    }}>
                    <img src='./5sBackward.svg' alt='' />
                </button>
                <button
                    type='button'
                    onClick={() => {
                        playing ? audioElement.current?.pause() : audioElement.current?.play()
                        setPlaying(!playing)
                    }}>
                    {playing ? 'pause' : 'play'}
                </button>
                <button
                    onClick={() => {
                        if (audioElement.current) {
                            audioElement.current.currentTime += 5
                        }
                    }}>
                    <img src='./5sForward.svg' alt='' />
                </button>
                <button onClick={props.next}>&gt;</button>
                <button>…</button>
            </div>
            <div className='expand' onMouseOver={() => setIsSwipedUp(true)}>
                <div className='img-container'>
                    <img loading='lazy' src={props.currentlyPlaying?.thumbnailUrl} alt='cover' />
                </div>
                <div className='infos'>
                    <p className='title'>title: {props.currentlyPlaying?.title}</p>
                    <p>
                        played: {progres} of {audioElement.current?.duration} seconds
                    </p>
                    <p className='chapter'>chapter: {currentChapter?.title}</p>
                </div>
                <div className='ctrls'>
                    <button
                        onClick={() => {
                            if (audioElement.current) timeloop(audioElement.current.currentTime, 5)
                        }}>
                        loop 5s
                    </button>
                    <button onClick={() => setIsLooped(false)}>exit loop</button>
                </div>
            </div>
        </div>
    )
}
