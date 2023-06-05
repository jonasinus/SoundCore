import { SongId } from '../../api/Client'

interface PlaylistsPageProps {
    queue: SongId[]
    setQueue: React.Dispatch<React.SetStateAction<SongId[]>>
}

export default function PlaylistsPage(props: PlaylistsPageProps) {
    return (
        <div className='page'>
            <div className='hero'>
                <h2>playlists:</h2>
            </div>
        </div>
    )
}
