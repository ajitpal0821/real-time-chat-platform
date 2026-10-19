const validate = (schemaOrConfig, target = "body") => {
    return (req, res, next) => {

        // Mode A: Multi-part schema { body, params, query }
        if (schemaOrConfig && (schemaOrConfig.body || schemaOrConfig.params || schemaOrConfig.query)) {
            const validated = {};
            const errors = [];
            const parts = ["params", "query", "body"];

            for (const part of parts) {
                if (!schemaOrConfig[part]) {
                    continue;
                }
                const result = schemaOrConfig[part].safeParse(req[part]);
                if (!result.success) {
                    result.error.issues.forEach((issue) => {
                        const fieldName = issue.path.length
                            ? issue.path.join(".")
                            : (issue.keys && issue.keys.length ? issue.keys.join(", ") : "");
                        errors.push({
                            field: fieldName ? `${part}.${fieldName}` : part,
                            message: issue.message
                        });
                    });
                } else {
                    if (part === "query") {
                        try {
                            req.query = result.data;
                        } catch {
                            Object.defineProperty(req, "query", {
                                value: result.data,
                                writable: true,
                                enumerable: true,
                                configurable: true
                            });
                        }
                    } else {
                        req[part] = result.data;
                    }
                    validated[part] = result.data;
                }
            }
            if (errors.length) {
                return res.status(400).json({
                    success: false,
                    message: "validation failed",
                    errors
                });
            }
            req.validated = validated;

            return next();
        }

        // Mode B: Single schema (e.g. registerSchema, loginSchema)
        const result = schemaOrConfig.safeParse(req[target]);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "validation failed",
                errors: result.error.issues.map((issue) => ({
                    field: issue.path.length
                        ? issue.path.join(".")
                        : (issue.keys && issue.keys.length ? issue.keys.join(", ") : ""),
                    message: issue.message
                }))
            });
        }

        if (target === "query") {
            try {
                req.query = result.data;
            } catch {
                Object.defineProperty(req, "query", {
                    value: result.data,
                    writable: true,
                    enumerable: true,
                    configurable: true
                });
            }
        } else {
            req[target] = result.data;
        }

        req.validated = { [target]: result.data };

        next();
    };
};

module.exports = validate;
