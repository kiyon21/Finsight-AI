import React from "react";

type Props = {
    current: number;
    total: number;
};

const ProgressBar = ({current, total}: Props) => {
    const percent = (current / total) * 100;

    return (
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ height: "10px", background: "#eee", borderRadius: "5px" }}>
            <div
              style={{
                height: "10px",
                width: `${percent}%`,
                background: "#4CAF50",
                borderRadius: "5px",
              }}
            />
          </div>
          <p style={{fontWeight:'bold'}}>{`Step ${current} of ${total}`}</p>
        </div>
      );
}
export default ProgressBar