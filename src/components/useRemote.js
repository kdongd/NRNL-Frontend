import { useEffect, useState } from 'react'

export default function useRemote(load) {
    const [state, setState] = useState({ data: null, error: '', loading: true })
    const [version, setVersion] = useState(0)

    useEffect(() => {
        let current = true
        setState({ data: null, error: '', loading: true })
        load().then(
            data => { if (current) setState({ data, error: '', loading: false }) },
            error => { if (current) setState({ data: null, error: error.message, loading: false }) }
        )
        return () => { current = false }
    }, [load, version])

    return { ...state, reload: () => setVersion(value => value + 1) }
}
