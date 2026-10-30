import { GAS_URL } from '../config'

export async function submitLeave(data) {

    const response = await fetch(
        GAS_URL,
        {
            method: 'POST',
            headers: {
                'Content-Type':
                    'application/json'
            },
            body: JSON.stringify(data)
        }
    )

    return await response.json()
}