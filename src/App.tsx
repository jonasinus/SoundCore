import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import Nav from './Componenets/Nav'
import SoundCore from './SouncCore'
import Home from './Routes/[home]'
import { Player } from './Componenets/Player'
import { Regions } from './api/Client'
import { useEffect } from 'react'
import Channel from './Routes/[channel]'
import Platlists from './Routes/[playlists]'
import AccountPage from './Routes/[account]'

export interface PageProps {
    soundCore: ReturnType<typeof SoundCore>
}

const USER_SETTINGS: UserSettings = {
    region: 'US',
    autoResume: true,
    playerType: 'music'
}

export type UserSettings = { region: Regions; autoResume: boolean; playerType: 'video' | 'music' | 'adaptive' }

export default function App() {
    const soundCore = SoundCore()

    useEffect(() => {
        if (USER_SETTINGS.autoResume) soundCore.resumeLastPlayed()

        soundCore.initPlaylistEngine()
        soundCore.getPlaylistHandler()?.loadAll()
        console.log(soundCore.getPlaylistHandler())

        soundCore.getPlaylistHandler()?.copyPublicPlaylist('PL4FB1JvhTLrGNSL4odYt72EqjDPJfjSdp')
    }, [])

    if (USER_SETTINGS.playerType === 'music')
        return (
            <>
                <BrowserRouter>
                    <Routes>
                        <Route path='/charts' element={<Home soundCore={soundCore} userSettings={USER_SETTINGS} />} />
                        <Route path='/dev' element={<Dev soundCore={soundCore} />} />
                        <Route path='/search' element={<>searchpage</>} />
                        <Route path='/channel' element={<Channel soundCore={soundCore} />} />
                        <Route path='/playlists' element={<Platlists soundCore={soundCore} />} />
                        <Route path='/account' element={<AccountPage soundCore={soundCore} />} />
                    </Routes>
                    <Player
                        getCurrentSong={soundCore.getCurrentSong}
                        getNextSong={soundCore.getNextSong}
                        getPreviousSong={soundCore.getPrevSong}
                        next={soundCore.nextSong}
                        prev={soundCore.prevSong}
                        filterTitle={soundCore.filterTitle}
                        truncateTitle={soundCore.truncateTitle}
                        playing={soundCore.playing}
                        setPlaying={soundCore.setPlaying}
                    />
                    <Nav region={USER_SETTINGS.region} />
                </BrowserRouter>
            </>
        )
    else
        return (
            <>
                <BrowserRouter>
                    <h1>player not yet implemented</h1>
                    <p>
                        change the player type at{' '}
                        <Link to={'/account#player-type'}>
                            <b>
                                <code>/account&gt;playertype</code>
                            </b>
                        </Link>
                    </p>
                    <Routes></Routes>
                    <Nav region={USER_SETTINGS.region} />
                </BrowserRouter>
            </>
        )
}

interface DevProps extends PageProps {}
function Dev(props: DevProps) {
    return (
        <div>
            <h2>welcome to the soundcore dev environment</h2>
            <p>as a security meassure, this site has NO access to databases etc, only to the piped / hyperpiped services!</p>
            <br />
            <br />
            <div>
                <p>prev: {props.soundCore.getPrevSong()?.title}</p>
                <p>current: {props.soundCore.getCurrentSong()?.title}</p>
                <p>next: {props.soundCore.getNextSong()?.title}</p>
                <p>total: {props.soundCore.getQueue()?.length}</p>
                <p>queueIndex: {props.soundCore.getQueueIndex()}</p>
            </div>
            <div>
                <button onClick={() => props.soundCore.prevSong()}>back</button>
                <button>play</button>
                <button onClick={() => props.soundCore.nextSong()}>next</button>
            </div>
            <button
                onClick={() => {
                    props.soundCore.addToQueue('deDFAmOPYkQ')
                }}>
                add to queue!
            </button>
            <button
                onClick={() => {
                    props.soundCore.removeFromQueue(0)
                }}>
                remove from queue!
            </button>
        </div>
    )
}
