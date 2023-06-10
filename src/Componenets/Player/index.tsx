import { useRef, useState, useEffect } from 'react'
import { QueueElement } from '../../api/Client'
import './player.css'

export interface PlayerProps {
    prev: () => void
    next: () => void
    getPreviousSong: () => QueueElement | null
    getCurrentSong: () => QueueElement | null
    getNextSong: () => QueueElement | null
    filterTitle: (s: string) => string
    truncateTitle: (s: string) => string
    playing: boolean
    setPlaying: React.Dispatch<React.SetStateAction<boolean>>
}

export function Player(props: PlayerProps) {
    const audioElement = useRef<HTMLAudioElement | null>(null)
    const [current, setCurrent] = useState<QueueElement | null>()
    const [isMinimized, setMinimized] = useState(true)
    const [title, setTitle] = useState('')
    const { playing, setPlaying } = props
    const [touchStartX, setTouchStartX] = useState<number | null>(null)
    const [touchStartY, setTouchStartY] = useState<number | null>(null)

    useEffect(() => {
        if (props.getCurrentSong()) {
            setCurrent(props.getCurrentSong())
            setTitle(props.truncateTitle(props.filterTitle(props.getCurrentSong()?.title || '')))
            audioElement.current?.load()
            audioElement.current?.play()
            setPlaying(true)
        }
    }, [props.getCurrentSong()])

    useEffect(() => {
        if (!playing) audioElement.current?.pause()
        else
            try {
                audioElement.current?.play()
            } catch (err) {
                audioElement.current?.pause()
                setPlaying(true)
                console.error({ err })
            }
    }, [playing])

    const handleLoadedMetadata = async () => {
        if (current?.startAt !== undefined) {
            audioElement.current!.currentTime = current.startAt
            await audioElement.current!.play()
        }
    }

    useEffect(() => {
        if (title != '') document.title = 'playing: ' + title
        else document.title = 'vibeo music streaming'
    }, [title])

    const handleProgress = (ev: React.SyntheticEvent<HTMLAudioElement, Event>) => {
        let currentTime = ev.currentTarget.currentTime
        let now = Date.now()

        let item = props.getCurrentSong()
        localStorage.setItem('currentlyPlaying', JSON.stringify({ ...item, now: now, currentTime: currentTime, startAt: currentTime }))

        if (ev.currentTarget.currentTime >= ev.currentTarget.duration) {
            setTimeout(() => {
                props.next()
            }, 250)
        }
    }

    const handleTouchStart = (ev: React.TouchEvent<HTMLDivElement>) => {
        setTouchStartX(ev.touches[0].clientX)
        setTouchStartY(ev.touches[0].clientY)
    }

    const handleTouchEnd = (ev: React.TouchEvent<HTMLDivElement>) => {
        if (touchStartX && ev.changedTouches[0].clientX - touchStartX > 50) {
            // Swiped right
            console.log('prev')
            props.prev()
        } else if (touchStartX && touchStartX - ev.changedTouches[0].clientX > 50) {
            // Swiped left
            console.log('next')
            props.next()
        }
        setTouchStartX(null)
        setTouchStartY(null)
    }

    useEffect(() => {
        const handleMediaSessionNext = () => {
            console.log('mediasession: next')
            props.next()
        }

        const handleMediaSessionPrev = () => {
            console.log('mediasession: prev')
            props.prev()
        }

        const handlePlayPause = () => {
            setPlaying(!playing)
        }

        // Check if the mediaSession API is supported by the browser
        if ('mediaSession' in navigator) {
            navigator.mediaSession.setActionHandler('nexttrack', handleMediaSessionNext)
            navigator.mediaSession.setActionHandler('previoustrack', handleMediaSessionPrev)
            navigator.mediaSession.setActionHandler('play', handlePlayPause)
            navigator.mediaSession.setActionHandler('pause', handlePlayPause)
        }

        return () => {
            if ('mediaSession' in navigator) {
                navigator.mediaSession.setActionHandler('nexttrack', null)
                navigator.mediaSession.setActionHandler('previoustrack', null)
            }
        }
    }, [])

    return (
        <div
            className={`player ${isMinimized ? 'minimized' : 'maximized'} ${current != null ? '' : 'no-'}track-loaded`}
            data-is-minimized={isMinimized}
            data-has-track={current != null}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}>
            <div className='alwaysThere'>
                <h2 onClick={() => setMinimized(!isMinimized)}>————</h2>
                <audio
                    src={current?.hqAudioSrc}
                    onPause={() => setPlaying(false)}
                    onPlay={() => setPlaying(true)}
                    onCanPlay={() =>
                        setTimeout(() => {
                            setPlaying(true)
                        }, 100)
                    }
                    ref={audioElement}
                    onTimeUpdate={(ev) => handleProgress(ev)}
                    onLoadedMetadata={handleLoadedMetadata}
                />
            </div>
            <div className={isMinimized ? 'minimized' : 'maximized'}>
                <div className='left'>
                    <img src={current?.thumbnailUrl} alt='img' />
                </div>
                <div className='info'>
                    <p className='title' title={props.filterTitle(current?.title || '')}>
                        {title}
                    </p>
                    <p className='artist'>{current?.uploader}</p>
                </div>
                <div className='right'>
                    <div className='ctrl'>
                        <button onClick={() => props.prev()}>lk</button>
                        <button onClick={() => setPlaying(!playing)}>{audioElement && playing ? '||' : '|>'}</button>
                    </div>
                </div>
            </div>
        </div>
    )
}
