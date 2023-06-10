import { useEffect, useState } from 'react'
import { PageProps, UserSettings } from '../../App'
import { ChartResults, Regions } from '../../api/Client'
import { Link } from 'react-router-dom'
import './home.css'

interface HomeProps extends PageProps {
    userSettings: UserSettings
}

export default function Home(props: HomeProps) {
    const [charts, setCharts] = useState<{ region: Regions; charts: ChartResults }>()

    useEffect(() => {
        async function f() {
            setCharts(await props.soundCore.getCharts(props.userSettings.region))
        }
        f()
    }, [])

    return (
        <div className='page home'>
            <h2>Trending right now</h2>
            <div className='chart-artists'>
                {charts?.charts.artists.map((e) => (
                    <Link to={'/channel?id=' + e.id} key={e.id}>
                        <img src={props.soundCore.rankThumbnails(e.thumbnails)[0].url} alt='' />
                        <div className='infos'>
                            <p className='name' title='artist name'>
                                {e.title}
                            </p>
                            <p className='subCount' title='subscriber count'>
                                {e.subscribers}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
            <div className='chart-songs'>
                {charts?.charts.trending.map((e) => (
                    <div onClick={() => props.soundCore.addToQueue(e.id)} key={e.id}>
                        <div>{e.title}</div>
                    </div>
                ))}
            </div>
        </div>
    )
}
