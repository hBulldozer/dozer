  public async getHeightsForTimeRange(startTime: number, endTime: number, numPoints: number): Promise<number[]> {
    const timestamps = Array.from(this.heightToTimestamp.values()).sort((a, b) => a - b);
    
    if (timestamps.length === 0) {
      logger.warn('No timestamps available in index');
      return [];
    }
    
    // Find closest blocks before and after the range
    const beforeHeight = await this.getHeightForTimestamp(startTime);
    const afterHeight = await this.getHeightForTimestamp(endTime);
    
    if (!beforeHeight && !afterHeight) {
      logger.warn({
        startTime,
        endTime,
        firstAvailable: timestamps[0],
        lastAvailable: timestamps[timestamps.length - 1]
      }, 'No blocks found around requested time range');
      return [];
    }
    
    // Calculate time step between points
    const timeStep = Math.max(1, Math.floor((endTime - startTime) / (numPoints - 1)));
    
    // Get heights for each time point
    const heightSet = new Set<number>();
    const targetTimes: number[] = [];
    
    // Add start and end times
    targetTimes.push(startTime);
    
    // Add intermediate points
    for (let i = 1; i < numPoints - 1; i++) {
      targetTimes.push(startTime + (i * timeStep));
    }
    
    // Add end time
    targetTimes.push(endTime);
    
    // Get heights for all target times
    for (const targetTime of targetTimes) {
      const height = await this.getHeightForTimestamp(targetTime);
      if (height) {
        heightSet.add(height);
      }
    }
    
    // Convert set to sorted array
    const heights = Array.from(heightSet).sort((a, b) => a - b);
    
    // Add intermediate blocks if we have gaps larger than expected
    const maxGap = Math.ceil((endTime - startTime) / (numPoints * 2)); // Allow half the time step as max gap
    const result: number[] = [];
    
    for (let i = 0; i < heights.length; i++) {
      result.push(heights[i]);
      
      // If there's a next height and the gap is too large
      if (i < heights.length - 1) {
        const gap = heights[i + 1] - heights[i];
        if (gap > maxGap) {
          // Add some intermediate heights
          const intermediateCount = Math.min(5, Math.floor(gap / maxGap)); // Add up to 5 intermediate points
          for (let j = 1; j <= intermediateCount; j++) {
            const intermediateHeight = heights[i] + Math.floor((gap * j) / (intermediateCount + 1));
            result.push(intermediateHeight);
          }
        }
      }
    }
    
    logger.info({
      requestedPoints: numPoints,
      returnedPoints: result.length,
      timeRange: {
        start: startTime,
        end: endTime,
        span: endTime - startTime
      },
      heightRange: {
        start: result[0],
        end: result[result.length - 1],
        span: result[result.length - 1] - result[0]
      }
    }, 'Generated heights for time range');
    
    return result;
  } 