export class CGP {
    constructor(inputs, outputs, colsBack, rows, cols, numFuncs, funcs) { //new
        this.inputs = inputs;
        this.outputs = outputs;
        this.colsBack = colsBack;
        this.rows = rows;
        this.cols = cols;
        this.numFuncs = numFuncs;
        this.funcs = funcs;
        this.nodes = this.initializeRandomNodes()
        this.outputNodes = this.initializeRandomOutputs()
        this.activeNodes = this.getActiveNodes()
        this.activeNodeCount = this.countActiveNodes()
    }

    glslString() {
        const funcString = (idx) => {
            if (idx >= 0) {
                const fNum = this.nodes[idx][1] + 1
                let result =  "fn" + fNum + "("
                for (let i = 0; i < this.nodes[idx][2]; i++){
                    result += funcString(this.nodes[idx][0][i]) + (i < this.nodes[idx][2] -1 ? "," : "")
                }
                return result + ")"
            }
            else {
                return "in" + (idx + this.inputs + 1)
            }
        }
        const results = []
        for (let i = 0; i < this.outputs; i++) {
            results.push(funcString(this.outputNodes[i]))
        }
        return results
    }

    serialize() {
        const result = {
            inputs : this.inputs,
            outputs: this.outputs,
            colsBack: this.colsBack,
            rows: this.rows,
            cols: this.cols,
            numFuncs: this.numFuncs,
            nodes: this.nodes,
            outputNodes: this.outputNodes,
            activeNodes: this.activeNodes,
            activeNodeCount: this.activeNodeCount
        }
        return result
    }

    evaluate(input) {
        const vals = []
        for (let i = 0; i < this.rows * this.cols; i++) {
            if (this.activeNodes[i]){
                const inputs = []
                for(let j = 0; j < this.nodes[i][2]; j++) {
                    if (this.nodes[i][0][j] >= 0) {
                        inputs.push(vals[this.nodes[i][0][j]])
                    }
                    else
                    {
                        inputs.push(input[this.nodes[i][0][j] + this.inputs])
                    } 
                }
                vals.push(this.funcs[this.nodes[i][1]][0](inputs))
            }
            else
            {
                vals.push(0.0)
            }
        }
        const outs = []
        for (let i = 0; i < this.outputs; i++) {
            outs.push(vals[this.outputNodes[i]])
        }
        return outs
    }

    countActiveNodes() {
        let count = 0
        for (let i = 0; i < this.activeNodes.length; i++) {
            if (this.activeNodes[i]) {
                count += 1
            }
        }
        return count
    }

    getActiveNodes() {
        const setActiveNodes = (idx, actnodes) => {
            if (idx >= 0 && actnodes[idx] != true) {
                actnodes[idx] = true
                for (let j = 0; j < this.nodes[idx][2]; j++)
                {
                    setActiveNodes(this.nodes[idx][0][j], actnodes)
                }
            }
        }
        const activeNodes = []
        for (let i = 0; i < this.rows * this.cols; i++) {
            activeNodes.push(false)
        }
        for (let i = 0; i < this.outputNodes.length; i++) {
            setActiveNodes(this.outputNodes[i], activeNodes)
        }
        return activeNodes

    }

    initializeRandomOutputs() {
        const outs = []
        for (let i = 0; i < this.outputs; i++) {
            outs.push(Math.floor(Math.random() * this.rows * this.cols))
        }

        return outs
    }

    initializeRandomNodes() {
        const randin = (range) => {
            const min = range[1]
            const max = range[0]
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }
        const nodes = []
        for (let i = 0; i < (this.rows * this.cols); i++) {
            const funcIdx = Math.floor(Math.random() * this.funcs.length)
            const rangeBack = this.getRangeBack(i)
            const arity = this.funcs[funcIdx][1]
            const ins = []
            for (let j = 0; j < arity; j++) {
                ins.push(randin(rangeBack))
            }
            nodes.push([ins, funcIdx, arity])
        }
        return nodes
    }

    getRangeBack(index) {
        const max = (index - (index % this.rows) - 1)
        const min = (max - (this.colsBack * this.rows) + 1) > (-1 * this.inputs) ? (max - (this.colsBack * this.rows) + 1) : (-1 * this.inputs)
        return [max, min]
    }

    copyFromOther(other) {

        const copyNodes = (nodes) => {
            const newNodes = []
            for (let i = 0; i < nodes.length; i++) {
                const newIns = []
                for (let j = 0; j < nodes[i][0].length; j++) {
                    newIns.push(nodes[i][0][j])
                }
                const newNode = [newIns, nodes[i][1], nodes[i][2]]
                newNodes.push(newNode)
            }
            return newNodes
        }
        const copyOuts = (outs) => {
            const newOuts = []
            for (let i = 0; i < outs.length; i++) {
                newOuts.push(outs[i])
            }
            return newOuts
        }

        this.inputs = other.inputs;
        this.outputs = other.outputs;
        this.colsBack = other.colsBack;
        this.rows = other.rows;
        this.cols = other.cols;
        this.numFuncs = other.numFuncs;
        this.funcs = other.funcs;
        this.nodes = copyNodes(other.nodes)
        this.outputNodes = copyOuts(other.outputNodes)
        this.activeNodes = this.getActiveNodes()
        this.activeNodeCount = this.countActiveNodes()
    }

    mutate(rate) {
        const randin = (range) => {
            const min = range[1]
            const max = range[0]
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }
        for (let i = 0; i < this.nodes.length; i++) {
            if (Math.random() <= rate) {
                if (Math.random() <= 0.3) {
                    const funcIdx = Math.floor(Math.random() * this.funcs.length)
                    const rangeBack = this.getRangeBack(i)
                    const arity = this.funcs[funcIdx][1]
                    const ins = []
                    for (let j = 0; j < arity; j++) {
                        ins.push(randin(rangeBack))
                    }
                    this.nodes[i] = [ins, funcIdx, arity]                
                }
                else
                {
                    if (this.nodes[i][2] > 0) {
                        const idx = Math.floor(Math.random() * this.nodes[i][2])
                        this.nodes[i][0][idx] = randin(this.getRangeBack(i))
                    }
                }

            }
        }
        for(let i = 0; i < this.outputs; i++) {
            if (Math.random() <= rate) {
                this.outputNodes[i] = Math.floor(Math.random() * this.cols * this.rows)
            }
        }
        this.activeNodes = this.getActiveNodes()
        this.activeNodeCount = this.countActiveNodes()
    }

}

export const defaultFuncs = [
    [(ins) => {return (ins[0] + ins[1]) / 2.0}, 2],
    [(ins) => {return (ins[0] - ins[1]) / 2.0}, 2],
    [(ins) => {return (ins[0] * ins[1]) / 2.0}, 2],
    //[(ins) => {return 1.0}, 0],
    //[(ins) => {return 0.0}, 0],
    //[(ins) => {return -1.0}, 0],
    [(ins) => {return ins[0] > ins[1] ? 1.0 : -1.0}, 2],
    [(ins) => {return Math.sin(2.0 * Math.PI * ins[0])}, 1],
    [(ins) => {return 1 / (1.0 + Math.exp(-ins[0]))}, 1]
]