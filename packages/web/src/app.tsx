import 'chartjs-plugin-streaming';
import React, { useEffect, useRef, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { fromEvent } from 'rxjs';
import { map } from 'rxjs/operators';

function App() {
  const ws = useRef(new WebSocket(`ws://localhost:9001`));
  const [ chart, setChart ] = useState<Line | null>(null);

  useEffect(() => {
    if (ws.current && chart) {
      const subscription =
        fromEvent<MessageEvent>(ws.current, 'message')
          .pipe(
            map(({data}: MessageEvent) => JSON.parse(data) as any),
          )
          .subscribe((metric: any) => {
            console.log(metric);
            chart.chartInstance.data.datasets[0].data.push({x: Date.now(), y: metric.current});
            // @ts-ignore
            chart.chartInstance.update({
              preservation: true,
            });
          });

      return () => subscription.unsubscribe();
    }
  }, [ ws.current, chart ]);

  return (
    <Line
      ref={setChart}
      data={{
        datasets: [ {
          data: [],
        }],
      }}
      options={{
        scales: {
          xAxes: [{
            type: 'realtime',
            realtime: {
              duration: 600000,    // data in the past 20000 ms will be displayed
              refresh: 1000,      // onRefresh callback will be called every 1000 ms
              delay: 2000,        // delay of 1000 ms, so upcoming values are known before plotting a line
              pause: false,       // chart is not paused
            }
          }],
        },
      }}
    />
  );
}

export default App;
