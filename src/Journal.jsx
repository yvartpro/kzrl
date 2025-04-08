import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Chart from 'chart.js/auto';
import { useNavigate } from 'react-router-dom'

const Journal = ({ setMsg }) => {
    const navigate = useNavigate()
    const [stats, setStats] = useState([]);
    const [selectedDate, setSelectedDate] = useState('');
    const [totals, setTotals] = useState({
        total_init: 0,
        total_entree: 0,
        total_sorties: 0,
        total_rest: 0,
        total_ben: 0,
        total_tot: 0
    });

    const chartRef = useRef(null);
    let chartInstance = useRef(null);

    const fetchDataByDate = (date) => {
        axios.get(`https://capbio.bi/api/daily_statistics.php?date=${date}`)
            .then((resp) => setStats(resp.data))
            .catch((err) => setMsg(err.message));
    };

    useEffect(() => {
        if (stats.length === 0) {
            setTotals({ total_init: 0, total_entree: 0, total_sorties: 0, total_rest: 0, total_ben: 0, total_tot: 0 });
            if (chartInstance.current) chartInstance.current.destroy();
            return;
        }

        const newTotals = stats.reduce((acc, item) => {
            const initValue = item.initial * item.pau;
            const entreeValue = item.plus * item.pau;
            const sortieValue = item.minus * item.price;
            const restantValue = (item.initial + item.plus - item.minus) * item.pau;
            const beneficeValue = (item.minus * item.price) - (item.minus * item.pau);

            return {
                total_init: acc.total_init + initValue,
                total_entree: acc.total_entree + entreeValue,
                total_sorties: acc.total_sorties + sortieValue,
                total_rest: acc.total_rest + restantValue,
                total_ben: acc.total_ben + beneficeValue,
            };
        }, { total_init: 0, total_entree: 0, total_sorties: 0, total_rest: 0, total_ben: 0 });

        newTotals.total_tot = newTotals.total_init + newTotals.total_entree;
        setTotals(newTotals);

        if (chartInstance.current) chartInstance.current.destroy();
        const ctx = chartRef.current.getContext('2d');

        chartInstance.current = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ["Stock initial", "Entrées", "Sorties", "Stock Restant", "Bénéfice brut"],
                datasets: [{
                    label: 'Valeurs Totales',
                    data: [newTotals.total_init, newTotals.total_entree, newTotals.total_sorties, newTotals.total_rest, newTotals.total_ben],
                    backgroundColor: ['rgba(54, 162, 235, 0.6)', 'rgba(75, 192, 192, 0.6)', 'rgba(255, 99, 132, 0.6)', 'rgba(255, 206, 86, 0.6)', 'rgba(153, 102, 255, 0.6)'],
                    borderColor: ['rgba(54, 162, 235, 1)', 'rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)', 'rgba(255, 206, 86, 1)', 'rgba(153, 102, 255, 1)'],
                    borderWidth: 1
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
        });
        console.log(stats)
    }, [stats]);

    const headers = ["#", "Article", "P.A.U", "Initial", "Entrées", "Sorties", "P.V.U", "Total", "Restant", "Bénéfice"];

    return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-6">
      <div className="w-full max-w-6xl">
        <div className="container mx-auto p-1 md:p-4">
            <div className="bg-white shadow-sm rounded-lg p-2 md:p-6">
                <p className="text-xl font-bold mb-4">Journal</p>
                <button className="" onClick={()=> navigate('/forex')}>Money</button>

                {/* Date Input */}
                <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => {
                            setSelectedDate(e.target.value);
                            fetchDataByDate(e.target.value);
                        }}
                        className="border border-gray-300 text-lg px-4 py-2 rounded-md w-full md:w-auto focus:ring-2 focus:ring-blue-400 outline-none"
                    />
                </div>

                {/* Journal Title (Fixed) */}
                <div className="bg-gray-100 p-4 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-2">Journal du {selectedDate}</h2>

                    {/* Scrollable Table */}
                    <div className="max-h-[400px] overflow-auto border border-gray-300 rounded-lg">
                        <table className="w-full border-collapse text-sm md:text-base">
                            <thead className="bg-gray-200 sticky top-0 z-10">
                                <tr>
                                    {headers.map((title, index) => (
                                        <th key={index} className="border px-4 py-2 text-left">{title}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {stats.map((item, index) => (
                                    <tr key={index} className="hover:bg-gray-100 text-left">
                                        <td className="border px-4 py-2">{index + 1}</td>
                                        <td className="border px-4 py-2">{item.prod_name}</td>
                                        <td className="border px-4 py-2">{item.pau}</td>
                                        <td className="border px-4 py-2">{item.initial}</td>
                                        <td className="border px-4 py-2">{item.plus}</td>
                                        <td className="border px-4 py-2">{item.minus}</td>
                                        <td className="border px-4 py-2">{item.price}</td>
                                        <td className="border px-4 py-2">{(item.initial + item.plus) * item.price}</td>
                                        <td className="border px-4 py-2">{item.initial + item.plus - item.minus}</td>
                                        <td className="border px-4 py-2">{(item.minus * item.price) - (item.minus * item.pau)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-100">
                                <tr>
                                    <td className="border px-4 py-2" colSpan="3"><b>Total</b></td>
                                    <td className="border px-4 py-2">{totals.total_init}</td>
                                    <td className="border px-4 py-2">{totals.total_entree}</td>
                                    <td className="border px-4 py-2">{totals.total_sorties}</td>
                                    <td className="border px-4 py-2"></td>
                                    <td className="border px-4 py-2">{totals.total_tot}</td>
                                    <td className="border px-4 py-2">{totals.total_rest}</td>
                                    <td className="border px-4 py-2">{totals.total_ben}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Chart */}
                <div className="mt-6 flex justify-start">
                    <canvas ref={chartRef} className="w-full max-w-xs sm:max-w-md"></canvas>
                </div>
            </div>
        </div>
      </div>
     </div>
    );
};

export default Journal;
