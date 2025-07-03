'use client';

import { useEffect, useRef } from 'react';
import { HeatMapData } from '@/lib/visualization';
import * as echarts from 'echarts/core';
import { GridComponent } from 'echarts/components';
import { HeatmapChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([GridComponent, HeatmapChart, CanvasRenderer]);

interface HeatMapProps {
  data: HeatMapData;
  height?: number;
}

export default function HeatMap({ data, height = 400 }: HeatMapProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  
  useEffect(() => {
    if (!chartRef.current) return;
    
    // Dispose previous chart instance if it exists
    if (chartInstance.current) {
      chartInstance.current.dispose();
    }
    
    // Initialize chart
    chartInstance.current = echarts.init(chartRef.current);
    
    // Generate colors
    const colors = ['#EBEDF0', '#9BE9A8', '#40C463', '#30A14E', '#216E39'];
    
    // Set options
    chartInstance.current.setOption({
      tooltip: {
        position: 'top',
        formatter: function (params: any) {
          const value = params.value;
          return `${params.value[0]} × ${params.value[1]}: ${Math.round(params.value[2])}%`;
        }
      },
      grid: {
        height: '70%',
        top: '10%',
        left: '20%',
      },
      xAxis: {
        type: 'category',
        data: data.xLabels,
        splitArea: {
          show: true
        },
        axisLabel: {
          rotate: 45,
          margin: 8,
        },
      },
      yAxis: {
        type: 'category',
        data: data.yLabels,
        splitArea: {
          show: true
        }
      },
      visualMap: {
        min: 0,
        max: 100,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '5%',
        text: ['Strong', 'Weak'],
        inRange: {
          color: colors
        }
      },
      series: [{
        name: 'Correlation Strength',
        type: 'heatmap',
        data: data.data,
        label: {
          show: false
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    });
    
    // Handle resize
    const handleResize = () => {
      chartInstance.current?.resize();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
    };
  }, [data]);
  
  return (
    <div ref={chartRef} style={{ height: `${height}px`, width: '100%' }} />
  );
}
