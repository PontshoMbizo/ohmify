# Tasks to-do

## 1. (2025/12/2022) Create problem page
- created normal data collection fields and simulator instances.

- need to use export circuit 
- need to collect simulation data at the end
- need to connect to the database

## 2. Automarker

- check sampler integrity (does it sample correctly?) : the test failed, the sample frequency is not enough ![alt text](image.png)
- use the data export functionality (for now)
-NB: find a way to store large simulation files

#### categorize problems and ways to verify the solutions:

- Power Electronics and wave-shaping
    - compare the time domain waveforms using standard deviation
    DONE
    - note to self, only change the sample time when you are sampling, it hinders the simulation process...   

- Frequency Domain Problems (Audio, Controls...)

- Digital Systems/Electronics
    - sample an array of input [I0, I1, ..., In], an array of outputs [O0, O1, ..., On] based on a universal clock [clk] used for synchronization
    - create a table from the sampled data that'll be used as the golden standard:
    |input->cat(I0, I1, ..., In)|output->cat(O0, O1, ..., On)| 
    - from this table, plot a logic analyzer graph with the logic levels on the y-axis and the clock pulse count on the x-axis (time)

